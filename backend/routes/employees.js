const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { requireLogin, requireRole } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

// Get all employees
router.get('/', requireLogin, async (req, res) => {
  try {
    const { division, status, search } = req.query;
    
    let query = `
      SELECT e.*, p.full_name, p.email, p.phone, p.avatar_url, d.name as division_name
      FROM employees e
      LEFT JOIN profiles p ON e.profile_id = p.id
      LEFT JOIN divisions d ON e.division_id = d.id
      WHERE 1=1
    `;
    
    const params = [];
    let paramCount = 0;

    if (division) {
      paramCount++;
      query += ` AND e.division_id = $${paramCount}`;
      params.push(division);
    }

    if (status) {
      paramCount++;
      query += ` AND e.employment_status = $${paramCount}`;
      params.push(status);
    }

    if (search) {
      paramCount++;
      query += ` AND (p.full_name ILIKE $${paramCount} OR p.email ILIKE $${paramCount} OR e.position ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }

    query += ' ORDER BY e.created_at DESC';

    const result = await db.query(query, params);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching employees:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch employees' 
    });
  }
});

// Get employee by ID
router.get('/:id', requireLogin, async (req, res) => {
  try {
    const query = `
      SELECT e.*, p.full_name, p.email, p.phone, p.avatar_url, d.name as division_name
      FROM employees e
      LEFT JOIN profiles p ON e.profile_id = p.id
      LEFT JOIN divisions d ON e.division_id = d.id
      WHERE e.id = $1
    `;
    
    const result = await db.query(query, [req.params.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Employee not found' 
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching employee:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch employee' 
    });
  }
});

// Get current user's employee record
router.get('/profile/me', requireLogin, async (req, res) => {
  try {
    const query = `
      SELECT e.*, p.full_name, p.email, p.phone, p.avatar_url, d.name as division_name
      FROM employees e
      LEFT JOIN profiles p ON e.profile_id = p.id
      LEFT JOIN divisions d ON e.division_id = d.id
      WHERE e.profile_id = $1
    `;
    
    const result = await db.query(query, [req.session.user.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Employee record not found' 
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching employee profile:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch employee profile' 
    });
  }
});

// Create employee (admin only)
router.post('/', requireRole(['admin']), [
  body('employeeId').trim().isLength({ min: 1 }),
  body('position').trim().isLength({ min: 1 }),
  body('joinDate').isISO8601(),
  body('profileId').isUUID()
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

    const {
      employeeId,
      profileId,
      position,
      divisionId,
      joinDate,
      salaryBase,
      address,
      emergencyContact,
      emergencyPhone
    } = req.body;

    const id = uuidv4();
    
    const query = `
      INSERT INTO employees (
        id, employee_id, profile_id, position, division_id, join_date,
        salary_base, address, emergency_contact, emergency_phone
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `;

    const result = await db.query(query, [
      id, employeeId, profileId, position, divisionId, joinDate,
      salaryBase, address, emergencyContact, emergencyPhone
    ]);

    res.status(201).json({
      success: true,
      message: 'Employee created successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating employee:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create employee' 
    });
  }
});

// Update employee
router.put('/:id', requireRole(['admin', 'manager']), async (req, res) => {
  try {
    const {
      position,
      divisionId,
      salaryBase,
      employmentStatus,
      address,
      emergencyContact,
      emergencyPhone
    } = req.body;

    const query = `
      UPDATE employees SET
        position = COALESCE($1, position),
        division_id = COALESCE($2, division_id),
        salary_base = COALESCE($3, salary_base),
        employment_status = COALESCE($4, employment_status),
        address = COALESCE($5, address),
        emergency_contact = COALESCE($6, emergency_contact),
        emergency_phone = COALESCE($7, emergency_phone),
        updated_at = NOW()
      WHERE id = $8
      RETURNING *
    `;

    const result = await db.query(query, [
      position, divisionId, salaryBase, employmentStatus,
      address, emergencyContact, emergencyPhone, req.params.id
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Employee not found' 
      });
    }

    res.json({
      success: true,
      message: 'Employee updated successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating employee:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update employee' 
    });
  }
});

module.exports = router;