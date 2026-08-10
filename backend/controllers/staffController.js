const { db, runQuery, getQuery, allQuery } = require('../database');
const crypto = require('crypto');

// Hash password
const hashPassword = (password) => {
  return crypto.createHash('sha256').update(password).digest('hex');
};

// Staff login
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
    }

    const sql = `SELECT * FROM staff WHERE email = ? AND status = 'active'`;
    const staff = await getQuery(sql, [email]);

    if (!staff) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    const hashedPassword = hashPassword(password);
    if (staff.password !== hashedPassword) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    await runQuery(
      `UPDATE staff SET last_login = CURRENT_TIMESTAMP WHERE id = ?`,
      [staff.id]
    );

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        id: staff.id,
        name: staff.name,
        email: staff.email,
        role: staff.role
      }
    });
  } catch (error) {
    console.error('Error in login:', error);
    next(error);
  }
};

// Register new staff
const register = async (req, res, next) => {
  try {
    const { name, email, password, role = 'staff' } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Name, email and password are required'
      });
    }

    const existing = await getQuery(`SELECT id FROM staff WHERE email = ?`, [email]);
    if (existing) {
      return res.status(400).json({
        success: false,
        error: 'Email already registered'
      });
    }

    const hashedPassword = hashPassword(password);
    
    const sql = `
      INSERT INTO staff (name, email, password, role, created_at)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
    `;
    
    const result = await runQuery(sql, [name, email, hashedPassword, role]);

    res.status(201).json({
      success: true,
      message: 'Staff registered successfully',
      data: {
        id: result.lastID,
        name,
        email,
        role
      }
    });
  } catch (error) {
    console.error('Error in register:', error);
    next(error);
  }
};

// Get staff profile
const getProfile = async (req, res, next) => {
  try {
    const { id } = req.query;
    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Staff ID required'
      });
    }

    const sql = `SELECT id, name, email, role, status, created_at, last_login FROM staff WHERE id = ?`;
    const staff = await getQuery(sql, [id]);

    if (!staff) {
      return res.status(404).json({
        success: false,
        error: 'Staff not found'
      });
    }

    res.json({
      success: true,
      data: staff
    });
  } catch (error) {
    console.error('Error in getProfile:', error);
    next(error);
  }
};

// Update staff profile
const updateProfile = async (req, res, next) => {
  try {
    const { id, name, email, role, status } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Staff ID required'
      });
    }

    const updates = [];
    const params = [];

    if (name) {
      updates.push('name = ?');
      params.push(name);
    }
    if (email) {
      updates.push('email = ?');
      params.push(email);
    }
    if (role) {
      updates.push('role = ?');
      params.push(role);
    }
    if (status) {
      updates.push('status = ?');
      params.push(status);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No fields to update'
      });
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);

    const sql = `UPDATE staff SET ${updates.join(', ')} WHERE id = ?`;
    const result = await runQuery(sql, params);

    if (result.changes === 0) {
      return res.status(404).json({
        success: false,
        error: 'Staff not found'
      });
    }

    res.json({
      success: true,
      message: 'Profile updated successfully'
    });
  } catch (error) {
    console.error('Error in updateProfile:', error);
    next(error);
  }
};

// Get all staff
const getAllStaff = async (req, res, next) => {
  try {
    const sql = `SELECT id, name, email, role, status, created_at, last_login FROM staff ORDER BY created_at DESC`;
    const staff = await allQuery(sql);

    res.json({
      success: true,
      data: staff
    });
  } catch (error) {
    console.error('Error in getAllStaff:', error);
    next(error);
  }
};

// Delete staff
const deleteStaff = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const sql = `DELETE FROM staff WHERE id = ?`;
    const result = await runQuery(sql, [id]);

    if (result.changes === 0) {
      return res.status(404).json({
        success: false,
        error: 'Staff not found'
      });
    }

    res.json({
      success: true,
      message: 'Staff deleted successfully'
    });
  } catch (error) {
    console.error('Error in deleteStaff:', error);
    next(error);
  }
};

module.exports = {
  login,
  register,
  getProfile,
  updateProfile,
  getAllStaff,
  deleteStaff
};