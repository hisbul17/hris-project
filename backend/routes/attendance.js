const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { requireLogin } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

// Get attendance records
router.get('/', requireLogin, async (req, res) => {
  try {
    const { employeeId, startDate, endDate, limit = 30 } = req.query;
    
    let query = `
      SELECT a.*, e.employee_id, p.full_name
      FROM attendance_records a
      LEFT JOIN employees e ON a.employee_id = e.id
      LEFT JOIN profiles p ON e.profile_id = p.id
      WHERE 1=1
    `;
    
    const params = [];
    let paramCount = 0;

    // If not admin/manager, only show own records
    if (req.session.user.role === 'employee') {
      const empResult = await db.query('SELECT id FROM employees WHERE profile_id = $1', [req.session.user.id]);
      if (empResult.rows.length > 0) {
        paramCount++;
        query += ` AND a.employee_id = $${paramCount}`;
        params.push(empResult.rows[0].id);
      }
    } else if (employeeId) {
      paramCount++;
      query += ` AND a.employee_id = $${paramCount}`;
      params.push(employeeId);
    }

    if (startDate) {
      paramCount++;
      query += ` AND a.date >= $${paramCount}`;
      params.push(startDate);
    }

    if (endDate) {
      paramCount++;
      query += ` AND a.date <= $${paramCount}`;
      params.push(endDate);
    }

    query += ` ORDER BY a.date DESC LIMIT $${paramCount + 1}`;
    params.push(limit);

    const result = await db.query(query, params);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching attendance:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch attendance records' 
    });
  }
});

// Get today's attendance
router.get('/today/:employeeId', requireLogin, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const query = `
      SELECT * FROM attendance_records 
      WHERE employee_id = $1 AND date = $2
    `;
    
    const result = await db.query(query, [req.params.employeeId, today]);
    
    res.json({
      success: true,
      data: result.rows[0] || null
    });
  } catch (error) {
    console.error('Error fetching today attendance:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch today attendance' 
    });
  }
});

// Clock in
router.post('/clock-in', requireLogin, [
  body('employeeId').isUUID(),
  body('location').optional().trim()
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

    const { employeeId, location, photoUrl } = req.body;
    const today = new Date().toISOString().split('T')[0];
    const now = new Date().toISOString();

    // Check if already clocked in today
    const existing = await db.query(
      'SELECT id, clock_in FROM attendance_records WHERE employee_id = $1 AND date = $2',
      [employeeId, today]
    );

    if (existing.rows.length > 0 && existing.rows[0].clock_in) {
      return res.status(400).json({ 
        success: false, 
        message: 'Already clocked in today' 
      });
    }

    const id = uuidv4();
    
    const query = `
      INSERT INTO attendance_records (
        id, employee_id, date, clock_in, clock_in_location, 
        clock_in_photo, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (employee_id, date) 
      DO UPDATE SET 
        clock_in = $4,
        clock_in_location = $5,
        clock_in_photo = $6,
        status = $7
      RETURNING *
    `;

    const result = await db.query(query, [
      id, employeeId, today, now, location, photoUrl, 'present'
    ]);

    res.json({
      success: true,
      message: 'Clock in successful',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error clocking in:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to clock in' 
    });
  }
});

// Clock out
router.post('/clock-out', requireLogin, [
  body('employeeId').isUUID(),
  body('location').optional().trim()
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

    const { employeeId, location, photoUrl } = req.body;
    const today = new Date().toISOString().split('T')[0];
    const now = new Date().toISOString();

    // Get today's record
    const existing = await db.query(
      'SELECT * FROM attendance_records WHERE employee_id = $1 AND date = $2',
      [employeeId, today]
    );

    if (existing.rows.length === 0 || !existing.rows[0].clock_in) {
      return res.status(400).json({ 
        success: false, 
        message: 'No clock-in record found for today' 
      });
    }

    if (existing.rows[0].clock_out) {
      return res.status(400).json({ 
        success: false, 
        message: 'Already clocked out today' 
      });
    }

    const query = `
      UPDATE attendance_records SET
        clock_out = $1,
        clock_out_location = $2,
        clock_out_photo = $3,
        updated_at = NOW()
      WHERE employee_id = $4 AND date = $5
      RETURNING *
    `;

    const result = await db.query(query, [
      now, location, photoUrl, employeeId, today
    ]);

    res.json({
      success: true,
      message: 'Clock out successful',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error clocking out:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to clock out' 
    });
  }
});

// Get attendance statistics
router.get('/stats/:employeeId', requireLogin, async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { month, year } = req.query;
    
    const currentDate = new Date();
    const targetMonth = month || (currentDate.getMonth() + 1);
    const targetYear = year || currentDate.getFullYear();
    
    const startDate = `${targetYear}-${targetMonth.toString().padStart(2, '0')}-01`;
    const endDate = new Date(targetYear, targetMonth, 0).toISOString().split('T')[0];

    const query = `
      SELECT 
        COUNT(*) as total_days,
        COUNT(CASE WHEN status = 'present' THEN 1 END) as present_days,
        COUNT(CASE WHEN status = 'late' THEN 1 END) as late_days,
        COUNT(CASE WHEN status = 'absent' THEN 1 END) as absent_days,
        AVG(
          CASE 
            WHEN clock_in IS NOT NULL AND clock_out IS NOT NULL 
            THEN EXTRACT(EPOCH FROM (clock_out::timestamp - clock_in::timestamp)) / 3600
          END
        ) as average_hours
      FROM attendance_records
      WHERE employee_id = $1 AND date >= $2 AND date <= $3
    `;

    const result = await db.query(query, [employeeId, startDate, endDate]);
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching attendance stats:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch attendance statistics' 
    });
  }
});

module.exports = router;