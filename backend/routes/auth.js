const express = require('express');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

// Register
router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('fullName').trim().isLength({ min: 2 })
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

    const { email, password, fullName, phone } = req.body;

    // Check if user exists
    const existingUser = await db.query('SELECT id FROM profiles WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'User already exists' 
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);
    const userId = uuidv4();

    // Start transaction
    await db.query('BEGIN');

    try {
      // Create profile
      await db.query(
        'INSERT INTO profiles (id, email, password_hash, full_name, phone, role) VALUES ($1, $2, $3, $4, $5, $6)',
        [userId, email, hashedPassword, fullName, phone || null, 'employee']
      );

      await db.query('COMMIT');

      // Create session
      const user = {
        id: userId,
        email,
        full_name: fullName,
        phone,
        role: 'employee'
      };

      req.session.user = user;

      res.status(201).json({
        success: true,
        message: 'User created successfully',
        user
      });
    } catch (error) {
      await db.query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Registration failed' 
    });
  }
});

// Login
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').exists()
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

    const { email, password } = req.body;

    // Get user
    const userQuery = `
      SELECT id, email, password_hash, full_name, phone, role, avatar_url
      FROM profiles
      WHERE email = $1
    `;
    
    const result = await db.query(userQuery, [email]);
    
    if (result.rows.length === 0) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }

    const user = result.rows[0];

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }

    // Update last login
    await db.query('UPDATE profiles SET last_login = NOW() WHERE id = $1', [user.id]);

    // Create session
    const sessionUser = {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      phone: user.phone,
      role: user.role,
      avatar_url: user.avatar_url
    };

    req.session.user = sessionUser;

    res.json({
      success: true,
      message: 'Login successful',
      user: sessionUser
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Login failed' 
    });
  }
});

// Get current user
router.get('/me', (req, res) => {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ 
      success: false, 
      message: 'Not authenticated' 
    });
  }

  res.json({
    success: true,
    user: req.session.user
  });
});

// Logout
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
      return res.status(500).json({ 
        success: false, 
        message: 'Logout failed' 
      });
    }

    res.clearCookie(process.env.SESSION_NAME || 'hris_session');
    res.json({
      success: true,
      message: 'Logout successful'
    });
  });
});

module.exports = router;