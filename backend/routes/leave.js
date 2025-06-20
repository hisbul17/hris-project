const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { requireLogin, requireRole } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

// Get leave requests
router.get('/', requireLogin, async (req, res) => {
  try {
    const { employeeId, status, startDate, endDate } = req.query;
    
    let query = `
      SELECT lr.*, 
             e.employee_id, e.position,
             p.full_name, p.avatar_url,
             ap.full_name as approver_name
      FROM leave_requests lr
      LEFT JOIN employees e ON lr.employee_id = e.id
      LEFT JOIN profiles p ON e.profile_id = p.id
      LEFT JOIN employees ae ON lr.approver_id = ae.id
      LEFT JOIN profiles ap ON ae.profile_id = ap.id
      WHERE 1=1
    `;
    
    const params = [];
    let paramCount = 0;

    // If employee, only show own requests
    if (req.session.user.role === 'employee') {
      const empResult = await db.query('SELECT id FROM employees WHERE profile_id = $1', [req.session.user.id]);
      if (empResult.rows.length > 0) {
        paramCount++;
        query += ` AND lr.employee_id = $${paramCount}`;
        params.push(empResult.rows[0].id);
      }
    } else if (employeeId) {
      paramCount++;
      query += ` AND lr.employee_id = $${paramCount}`;
      params.push(employeeId);
    }

    if (status) {
      paramCount++;
      query += ` AND lr.status = $${paramCount}`;
      params.push(status);
    }

    if (startDate) {
      paramCount++;
      query += ` AND lr.start_date >= $${paramCount}`;
      params.push(startDate);
    }

    if (endDate) {
      paramCount++;
      query += ` AND lr.end_date <= $${paramCount}`;
      params.push(endDate);
    }

    query += ' ORDER BY lr.created_at DESC';

    const result = await db.query(query, params);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching leave requests:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch leave requests' 
    });
  }
});

// Create leave request
router.post('/', requireLogin, [
  body('employeeId').isUUID(),
  body('leaveType').isIn(['annual', 'sick', 'emergency', 'maternity', 'paternity', 'other']),
  body('startDate').isISO8601(),
  body('endDate').isISO8601(),
  body('reason').trim().isLength({ min: 1 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Validation failed',
        errors: errors.array() 
      });
    }

    const { employeeId, leaveType, startDate, endDate, reason } = req.body;
    
    // Calculate days
    const start = new Date(startDate);
    const end = new Date(endDate);
    const daysRequested = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

    const id = uuidv4();
    
    const query = `
      INSERT INTO leave_requests (
        id, employee_id, leave_type, start_date, end_date, 
        days_requested, reason, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;

    const result = await db.query(query, [
      id, employeeId, leaveType, startDate, endDate, 
      daysRequested, reason, 'pending'
    ]);

    res.status(201).json({
      success: true,
      message: 'Leave request created successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating leave request:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create leave request' 
    });
  }
});

// Approve/Reject leave request
router.put('/:id/status', requireRole(['admin', 'manager']), [
  body('status').isIn(['approved', 'rejected']),
  body('rejectionReason').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Validation failed',
        errors: errors.array() 
      });
    }

    const { status, rejectionReason } = req.body;
    
    // Get approver employee ID
    const approverResult = await db.query('SELECT id FROM employees WHERE profile_id = $1', [req.session.user.id]);
    if (approverResult.rows.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Approver employee record not found' 
      });
    }

    const approverId = approverResult.rows[0].id;
    
    const query = `
      UPDATE leave_requests SET
        status = $1,
        approver_id = $2,
        approved_at = NOW(),
        rejection_reason = $3,
        updated_at = NOW()
      WHERE id = $4
      RETURNING *
    `;

    const result = await db.query(query, [
      status, approverId, rejectionReason, req.params.id
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Leave request not found' 
      });
    }

    res.json({
      success: true,
      message: `Leave request ${status} successfully`,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating leave request:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update leave request' 
    });
  }
});

// Get leave balance
router.get('/balance/:employeeId', requireLogin, async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { year } = req.query;
    const targetYear = year || new Date().getFullYear();
    
    const query = `
      SELECT 
        leave_type,
        SUM(days_requested) as days_used
      FROM leave_requests
      WHERE employee_id = $1 
        AND status = 'approved'
        AND EXTRACT(YEAR FROM start_date) = $2
      GROUP BY leave_type
    `;

    const result = await db.query(query, [employeeId, targetYear]);
    
    // Standard entitlements (can be made configurable)
    const entitlements = {
      annual: 12,
      sick: 12,
      emergency: 3,
      maternity: 90,
      paternity: 7,
      other: 0
    };

    const used = {};
    const balance = {};

    // Initialize used days
    Object.keys(entitlements).forEach(type => {
      used[type] = 0;
    });

    // Calculate used days
    result.rows.forEach(row => {
      used[row.leave_type] = parseInt(row.days_used);
    });

    // Calculate balance
    Object.keys(entitlements).forEach(type => {
      balance[type] = entitlements[type] - used[type];
    });

    res.json({
      success: true,
      data: {
        entitlements,
        used,
        balance
      }
    });
  } catch (error) {
    console.error('Error fetching leave balance:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch leave balance' 
    });
  }
});

module.exports = router;