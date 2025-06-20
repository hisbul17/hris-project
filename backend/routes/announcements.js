const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { requireLogin, requireRole } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

// Get announcements
router.get('/', requireLogin, async (req, res) => {
  try {
    const { type, limit = 50 } = req.query;
    
    let query = `
      SELECT a.*, p.full_name as author_name, p.avatar_url as author_avatar
      FROM announcements a
      LEFT JOIN profiles p ON a.published_by = p.id
      WHERE a.is_published = true
    `;
    
    const params = [];
    let paramCount = 0;

    // Filter by user role
    if (req.session.user.role) {
      paramCount++;
      query += ` AND ($${paramCount} = ANY(a.target_roles) OR a.target_roles IS NULL)`;
      params.push(req.session.user.role);
    }

    if (type) {
      paramCount++;
      query += ` AND a.announcement_type = $${paramCount}`;
      params.push(type);
    }

    // Check if not expired
    query += ` AND (a.expires_at IS NULL OR a.expires_at > NOW())`;

    query += ` ORDER BY a.published_at DESC LIMIT $${paramCount + 1}`;
    params.push(limit);

    const result = await db.query(query, params);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching announcements:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch announcements' 
    });
  }
});

// Create announcement
router.post('/', requireRole(['admin', 'manager']), [
  body('title').trim().isLength({ min: 1 }),
  body('content').trim().isLength({ min: 1 }),
  body('announcementType').isIn(['general', 'urgent', 'event']),
  body('targetRoles').isArray()
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
      title,
      content,
      announcementType,
      targetRoles,
      expiresAt,
      isPublished = true
    } = req.body;

    const id = uuidv4();
    
    const query = `
      INSERT INTO announcements (
        id, title, content, announcement_type, target_roles,
        expires_at, is_published, published_by, published_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;

    const result = await db.query(query, [
      id, title, content, announcementType, targetRoles,
      expiresAt, isPublished, req.session.user.id, 
      isPublished ? new Date().toISOString() : null
    ]);

    res.status(201).json({
      success: true,
      message: 'Announcement created successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating announcement:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create announcement' 
    });
  }
});

// Update announcement
router.put('/:id', requireRole(['admin', 'manager']), async (req, res) => {
  try {
    const {
      title,
      content,
      announcementType,
      targetRoles,
      expiresAt,
      isPublished
    } = req.body;

    const query = `
      UPDATE announcements SET
        title = COALESCE($1, title),
        content = COALESCE($2, content),
        announcement_type = COALESCE($3, announcement_type),
        target_roles = COALESCE($4, target_roles),
        expires_at = COALESCE($5, expires_at),
        is_published = COALESCE($6, is_published),
        updated_at = NOW()
      WHERE id = $7
      RETURNING *
    `;

    const result = await db.query(query, [
      title, content, announcementType, targetRoles,
      expiresAt, isPublished, req.params.id
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Announcement not found' 
      });
    }

    res.json({
      success: true,
      message: 'Announcement updated successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating announcement:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update announcement' 
    });
  }
});

// Delete announcement
router.delete('/:id', requireRole(['admin']), async (req, res) => {
  try {
    const result = await db.query('DELETE FROM announcements WHERE id = $1 RETURNING id', [req.params.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Announcement not found' 
      });
    }

    res.json({
      success: true,
      message: 'Announcement deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting announcement:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to delete announcement' 
    });
  }
});

module.exports = router;