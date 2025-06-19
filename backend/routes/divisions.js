const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { requireRole } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

// Get all divisions
router.get('/', async (req, res) => {
  try {
    const query = `
      SELECT d.*, p.full_name as manager_name
      FROM divisions d
      LEFT JOIN employees e ON d.manager_id = e.id
      LEFT JOIN profiles p ON e.profile_id = p.user_id
      ORDER BY d.name
    `;
    
    const result = await db.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching divisions:', error);
    res.status(500).json({ error: 'Failed to fetch divisions' });
  }
});

// Create division
router.post('/', requireRole(['admin']), [
  body('name').trim().isLength({ min: 1 }),
  body('description').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, description, managerId } = req.body;
    const id = uuidv4();
    
    const query = `
      INSERT INTO divisions (id, name, description, manager_id)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;

    const result = await db.query(query, [id, name, description, managerId]);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating division:', error);
    res.status(500).json({ error: 'Failed to create division' });
  }
});

module.exports = router;