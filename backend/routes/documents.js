const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { requireRole } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

// Get documents
router.get('/', async (req, res) => {
  try {
    const { employeeId, documentType } = req.query;
    
    let query = `
      SELECT d.*, e.employee_id, p.full_name as employee_name
      FROM documents d
      LEFT JOIN employees e ON d.employee_id = e.id
      LEFT JOIN profiles p ON e.profile_id = p.user_id
      WHERE 1=1
    `;
    
    const params = [];
    let paramCount = 0;

    // If employee, only show own documents
    if (req.user.role === 'employee') {
      const empResult = await db.query('SELECT id FROM employees WHERE profile_id = $1', [req.user.id]);
      if (empResult.rows.length > 0) {
        paramCount++;
        query += ` AND d.employee_id = $${paramCount}`;
        params.push(empResult.rows[0].id);
      }
    } else if (employeeId) {
      paramCount++;
      query += ` AND d.employee_id = $${paramCount}`;
      params.push(employeeId);
    }

    if (documentType) {
      paramCount++;
      query += ` AND d.document_type = $${paramCount}`;
      params.push(documentType);
    }

    query += ' ORDER BY d.created_at DESC';

    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching documents:', error);
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
});

// Upload document
router.post('/', [
  body('employeeId').isUUID(),
  body('name').trim().isLength({ min: 1 }),
  body('documentType').trim().isLength({ min: 1 }),
  body('fileUrl').isURL()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      employeeId,
      name,
      documentType,
      fileUrl,
      fileSize,
      mimeType,
      expiresAt
    } = req.body;

    const id = uuidv4();
    
    const query = `
      INSERT INTO documents (
        id, employee_id, name, document_type, file_url,
        file_size, mime_type, uploaded_by, expires_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;

    const result = await db.query(query, [
      id, employeeId, name, documentType, fileUrl,
      fileSize, mimeType, req.user.id, expiresAt
    ]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error uploading document:', error);
    res.status(500).json({ error: 'Failed to upload document' });
  }
});

// Delete document
router.delete('/:id', async (req, res) => {
  try {
    // Check if user can delete this document
    let query = 'SELECT * FROM documents WHERE id = $1';
    const params = [req.params.id];

    if (req.user.role === 'employee') {
      const empResult = await db.query('SELECT id FROM employees WHERE profile_id = $1', [req.user.id]);
      if (empResult.rows.length > 0) {
        query += ' AND employee_id = $2';
        params.push(empResult.rows[0].id);
      }
    }

    const docResult = await db.query(query, params);
    
    if (docResult.rows.length === 0) {
      return res.status(404).json({ error: 'Document not found or access denied' });
    }

    await db.query('DELETE FROM documents WHERE id = $1', [req.params.id]);
    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Error deleting document:', error);
    res.status(500).json({ error: 'Failed to delete document' });
  }
});

module.exports = router;