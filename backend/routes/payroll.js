const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { requireRole } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

// Get salary records
router.get('/salary-records', async (req, res) => {
  try {
    const { employeeId, year, month } = req.query;
    
    let query = `
      SELECT sr.*, e.employee_id, p.full_name as employee_name
      FROM salary_records sr
      LEFT JOIN employees e ON sr.employee_id = e.id
      LEFT JOIN profiles p ON e.profile_id = p.user_id
      WHERE 1=1
    `;
    
    const params = [];
    let paramCount = 0;

    // If employee, only show own records
    if (req.user.role === 'employee') {
      const empResult = await db.query('SELECT id FROM employees WHERE profile_id = $1', [req.user.id]);
      if (empResult.rows.length > 0) {
        paramCount++;
        query += ` AND sr.employee_id = $${paramCount}`;
        params.push(empResult.rows[0].id);
      }
    } else if (employeeId) {
      paramCount++;
      query += ` AND sr.employee_id = $${paramCount}`;
      params.push(employeeId);
    }

    if (year) {
      paramCount++;
      query += ` AND sr.period_year = $${paramCount}`;
      params.push(year);
    }

    if (month) {
      paramCount++;
      query += ` AND sr.period_month = $${paramCount}`;
      params.push(month);
    }

    query += ' ORDER BY sr.period_year DESC, sr.period_month DESC';

    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching salary records:', error);
    res.status(500).json({ error: 'Failed to fetch salary records' });
  }
});

// Get payroll components
router.get('/components', requireRole(['admin', 'manager']), async (req, res) => {
  try {
    const query = 'SELECT * FROM payroll_components WHERE is_active = true ORDER BY component_type, name';
    const result = await db.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching payroll components:', error);
    res.status(500).json({ error: 'Failed to fetch payroll components' });
  }
});

// Create salary record
router.post('/salary-records', requireRole(['admin']), [
  body('employeeId').isUUID(),
  body('periodMonth').isInt({ min: 1, max: 12 }),
  body('periodYear').isInt({ min: 2020 }),
  body('baseSalary').isDecimal()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      employeeId,
      periodMonth,
      periodYear,
      baseSalary,
      allowances,
      deductions,
      taxAmount
    } = req.body;

    // Calculate gross and net salary
    const allowanceTotal = Object.values(allowances || {}).reduce((sum, val) => sum + parseFloat(val), 0);
    const deductionTotal = Object.values(deductions || {}).reduce((sum, val) => sum + parseFloat(val), 0);
    const grossSalary = parseFloat(baseSalary) + allowanceTotal;
    const netSalary = grossSalary - deductionTotal - (parseFloat(taxAmount) || 0);

    const id = uuidv4();
    
    const query = `
      INSERT INTO salary_records (
        id, employee_id, period_month, period_year, base_salary,
        allowances, deductions, tax_amount, gross_salary, net_salary,
        processed_by, processed_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
      RETURNING *
    `;

    const result = await db.query(query, [
      id, employeeId, periodMonth, periodYear, baseSalary,
      JSON.stringify(allowances), JSON.stringify(deductions),
      taxAmount, grossSalary, netSalary, req.user.id
    ]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating salary record:', error);
    res.status(500).json({ error: 'Failed to create salary record' });
  }
});

module.exports = router;