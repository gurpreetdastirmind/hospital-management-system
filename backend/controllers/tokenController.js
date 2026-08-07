const { db, runQuery, getQuery, allQuery } = require('../database');

// Generate token number
const generateTokenNumber = async (department) => {
  const today = new Date().toISOString().split('T')[0];
  const sql = `
    SELECT token_number FROM tokens 
    WHERE department = ? AND date(created_at) = ?
    ORDER BY token_number DESC LIMIT 1
  `;
  const lastToken = await getQuery(sql, [department, today]);
  
  if (lastToken) {
    const parts = lastToken.token_number.split('-');
    const num = parseInt(parts[parts.length - 1]) + 1;
    const prefix = department.substring(0, 1).toUpperCase();
    return `${prefix}-${String(num).padStart(2, '0')}`;
  }
  const prefix = department.substring(0, 1).toUpperCase();
  return `${prefix}-01`;
};

// Get token by ID (helper function)
const getTokenById = async (id) => {
  const sql = `SELECT * FROM tokens WHERE id = ?`;
  return await getQuery(sql, [id]);
};

// Get current called token for a department
const getCurrentCalledToken = async (department) => {
  const sql = `
    SELECT * FROM tokens 
    WHERE department = ? AND status = 'called'
    ORDER BY created_at DESC LIMIT 1
  `;
  return await getQuery(sql, [department]);
};

// Check and auto-complete expired tokens - FIXED
const checkAndAutoComplete = async () => {
  const now = new Date();
  const twentyMinutesAgo = new Date(now.getTime() - 20 * 60 * 1000);
  
  // Format the date for SQLite comparison
  const twentyMinutesAgoStr = twentyMinutesAgo.toISOString().replace('T', ' ').slice(0, 19);
  
  // Find all called tokens where updated_at is older than 20 minutes
  // We use updated_at because that's when the token was called
  const sql = `
    SELECT * FROM tokens 
    WHERE status = 'called' 
    AND datetime(updated_at) < datetime(?)
    ORDER BY created_at ASC
  `;
  
  const expiredTokens = await allQuery(sql, [twentyMinutesAgoStr]);
  
  console.log(`⏰ Found ${expiredTokens.length} expired tokens (called before ${twentyMinutesAgoStr})`);
  
  for (const token of expiredTokens) {
    // Mark as completed
    await runQuery(
      `UPDATE tokens SET status = 'completed', updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [token.id]
    );
    console.log(`✅ Auto-completed ${token.token_number} for ${token.department} department (was called at ${token.updated_at})`);
    
    // Auto-call next token for this department
    await autoCallNextToken(token.department);
  }
  
  return expiredTokens.length;
};

// Auto-call next token - FIXED: set updated_at to current time when called
const autoCallNextToken = async (department) => {
  // Find next waiting token
  const nextSql = `
    SELECT * FROM tokens 
    WHERE department = ? AND status = 'waiting'
    ORDER BY created_at ASC LIMIT 1
  `;
  
  const nextToken = await getQuery(nextSql, [department]);
  
  if (nextToken) {
    // Mark as called - set updated_at to current time for timer start
    await runQuery(
      `UPDATE tokens SET status = 'called', updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [nextToken.id]
    );
    
    console.log(`🔄 Auto-called ${nextToken.token_number} for ${department} department at ${new Date().toISOString()}`);
    return nextToken;
  }
  
  return null;
};

// Generate new token
const generateToken = async (req, res, next) => {
  try {
    const { name, phoneNumber, age, department, source = 'App' } = req.body;
    
    if (!name || !phoneNumber || !department) {
      return res.status(400).json({
        success: false,
        error: 'Name, phone number and department are required'
      });
    }

    if (!/^\d{10}$/.test(phoneNumber)) {
      return res.status(400).json({
        success: false,
        error: 'Phone number must be 10 digits'
      });
    }
    
    const deptSql = `SELECT * FROM departments WHERE name = ?`;
    const departmentInfo = await getQuery(deptSql, [department]);
    
    if (!departmentInfo) {
      return res.status(404).json({
        success: false,
        error: 'Department not found'
      });
    }
    
    if (departmentInfo.is_open === 0) {
      return res.status(400).json({
        success: false,
        error: 'Department is currently closed'
      });
    }
    
    const tokenNumber = await generateTokenNumber(department);
    const roomNumber = departmentInfo.room || `Room ${Math.floor(Math.random() * 20) + 1}`;
    
    const sql = `
      INSERT INTO tokens (
        token_number, patient_name, phone_number, age, department, 
        room_number, source, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'waiting', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `;
    
    const result = await runQuery(sql, [
      tokenNumber,
      name,
      phoneNumber,
      age || null,
      department,
      roomNumber,
      source
    ]);
    
    const newToken = await getTokenById(result.lastID);
    
    // Check if this is the first token for this department - if so, call it immediately
    const waitingCount = await getQuery(
      `SELECT COUNT(*) as count FROM tokens WHERE department = ? AND status = 'waiting'`,
      [department]
    );
    
    if (waitingCount.count === 1) {
      // This is the only waiting token, call it
      await runQuery(
        `UPDATE tokens SET status = 'called', updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [newToken.id]
      );
      const updatedToken = await getTokenById(newToken.id);
      
      res.status(201).json({
        success: true,
        message: 'Token generated and called successfully',
        data: updatedToken
      });
    } else {
      res.status(201).json({
        success: true,
        message: 'Token generated successfully',
        data: newToken
      });
    }
  } catch (error) {
    console.error('Error generating token:', error);
    next(error);
  }
};

// Get token by ID (route handler)
const getTokenByIdRoute = async (req, res, next) => {
  try {
    const { id } = req.params;
    const token = await getTokenById(id);
    
    if (!token) {
      return res.status(404).json({
        success: false,
        error: 'Token not found'
      });
    }
    
    res.json({
      success: true,
      data: token
    });
  } catch (error) {
    console.error('Error getting token:', error);
    next(error);
  }
};

// Get all tokens - FIXED: Check expiry on every request
const getTokens = async (req, res, next) => {
  try {
    // First, check and auto-complete expired tokens
    await checkAndAutoComplete();
    
    const { limit = 100, offset = 0, status, department, date } = req.query;
    let sql = `SELECT * FROM tokens WHERE 1=1`;
    const params = [];
    
    if (status) {
      sql += ` AND status = ?`;
      params.push(status);
    }
    if (department) {
      sql += ` AND department = ?`;
      params.push(department);
    }
    if (date) {
      sql += ` AND date(created_at) = ?`;
      params.push(date);
    }
    
    sql += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));
    
    const tokens = await allQuery(sql, params);
    
    let countSql = `SELECT COUNT(*) as total FROM tokens WHERE 1=1`;
    const countParams = [];
    if (status) {
      countSql += ` AND status = ?`;
      countParams.push(status);
    }
    if (department) {
      countSql += ` AND department = ?`;
      countParams.push(department);
    }
    if (date) {
      countSql += ` AND date(created_at) = ?`;
      countParams.push(date);
    }
    const countResult = await getQuery(countSql, countParams);
    
    res.json({
      success: true,
      data: tokens,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: countResult?.total || 0,
        count: tokens.length
      }
    });
  } catch (error) {
    console.error('Error getting tokens:', error);
    next(error);
  }
};

// Update token status - FIXED: Properly handle timers
const updateTokenStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const validStatuses = ['waiting', 'called', 'completed', 'missed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status. Must be: waiting, called, completed, or missed'
      });
    }
    
    const existingToken = await getTokenById(id);
    if (!existingToken) {
      return res.status(404).json({
        success: false,
        error: 'Token not found'
      });
    }
    
    let updateSql = `UPDATE tokens SET status = ? WHERE id = ?`;
    let params = [status, id];
    
    // If setting to 'called', update updated_at to start timer
    if (status === 'called') {
      updateSql = `UPDATE tokens SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
      params = [status, id];
      console.log(`📢 Token ${existingToken.token_number} called for ${existingToken.department} at ${new Date().toISOString()}`);
    }
    
    // If setting to 'completed', update updated_at and auto-call next
    if (status === 'completed') {
      updateSql = `UPDATE tokens SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
      params = [status, id];
      console.log(`✅ Token ${existingToken.token_number} completed for ${existingToken.department}`);
    }
    
    const result = await runQuery(updateSql, params);
    
    if (result.changes === 0) {
      return res.status(404).json({
        success: false,
        error: 'Token not found'
      });
    }
    
    const updatedToken = await getTokenById(id);
    
    // If status is 'completed', auto-call next token
    if (status === 'completed') {
      await autoCallNextToken(updatedToken.department);
    }
    
    res.json({
      success: true,
      message: 'Token status updated successfully',
      data: updatedToken
    });
  } catch (error) {
    console.error('Error updating token status:', error);
    next(error);
  }
};

// Get tokens by department
const getTokensByDepartment = async (req, res, next) => {
  try {
    const { department } = req.params;
    const { status = 'waiting,called' } = req.query;
    const statuses = status.split(',');
    const placeholders = statuses.map(() => '?').join(',');
    
    const sql = `
      SELECT * FROM tokens 
      WHERE department = ? AND status IN (${placeholders})
      ORDER BY created_at ASC
    `;
    const params = [department, ...statuses];
    
    const tokens = await allQuery(sql, params);
    
    res.json({
      success: true,
      data: tokens,
      count: tokens.length
    });
  } catch (error) {
    console.error('Error getting tokens by department:', error);
    next(error);
  }
};

// Update token
const updateToken = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { patient_name, phone_number, age, department, room_number } = req.body;
    
    const existingToken = await getTokenById(id);
    if (!existingToken) {
      return res.status(404).json({
        success: false,
        error: 'Token not found'
      });
    }
    
    const updates = [];
    const params = [];
    
    if (patient_name) {
      updates.push('patient_name = ?');
      params.push(patient_name);
    }
    if (phone_number) {
      updates.push('phone_number = ?');
      params.push(phone_number);
    }
    if (age !== undefined) {
      updates.push('age = ?');
      params.push(age);
    }
    if (department) {
      updates.push('department = ?');
      params.push(department);
    }
    if (room_number) {
      updates.push('room_number = ?');
      params.push(room_number);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No fields to update'
      });
    }
    
    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);
    
    const sql = `UPDATE tokens SET ${updates.join(', ')} WHERE id = ?`;
    await runQuery(sql, params);
    
    const updatedToken = await getTokenById(id);
    
    res.json({
      success: true,
      message: 'Token updated successfully',
      data: updatedToken
    });
  } catch (error) {
    console.error('Error updating token:', error);
    next(error);
  }
};

// Get daily statistics
const getDailyStats = async (req, res, next) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const sql = `
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'waiting' THEN 1 END) as waiting,
        COUNT(CASE WHEN status = 'called' THEN 1 END) as called,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
        COUNT(CASE WHEN status = 'missed' THEN 1 END) as missed,
        COUNT(CASE WHEN source = 'App' THEN 1 END) as from_app,
        COUNT(CASE WHEN source = 'Counter' THEN 1 END) as from_counter
      FROM tokens 
      WHERE date(created_at) = ?
    `;
    
    const stats = await getQuery(sql, [today]);
    
    const deptSql = `
      SELECT 
        department,
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'waiting' THEN 1 END) as waiting,
        COUNT(CASE WHEN status = 'called' THEN 1 END) as called,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed
      FROM tokens 
      WHERE date(created_at) = ?
      GROUP BY department
    `;
    
    const deptStats = await allQuery(deptSql, [today]);
    
    res.json({
      success: true,
      data: {
        ...stats,
        department_breakdown: deptStats
      }
    });
  } catch (error) {
    console.error('Error getting daily stats:', error);
    next(error);
  }
};

// Auto-call next token manually (for staff)
const callNextToken = async (req, res, next) => {
  try {
    const { department } = req.body;
    
    if (!department) {
      return res.status(400).json({
        success: false,
        error: 'Department is required'
      });
    }
    
    const nextToken = await autoCallNextToken(department);
    
    if (nextToken) {
      res.json({
        success: true,
        message: `Next token ${nextToken.token_number} called for ${department}`,
        data: nextToken
      });
    } else {
      res.json({
        success: true,
        message: `No waiting tokens for ${department}`,
        data: null
      });
    }
  } catch (error) {
    console.error('Error calling next token:', error);
    next(error);
  }
};

// Get department queue status
const getDepartmentStatus = async (req, res, next) => {
  try {
    const { department } = req.params;
    
    // Get current called token
    const currentCalled = await getCurrentCalledToken(department);
    
    // Get waiting count
    const waitingCount = await getQuery(
      `SELECT COUNT(*) as count FROM tokens WHERE department = ? AND status = 'waiting'`,
      [department]
    );
    
    // Get all waiting tokens
    const waitingTokens = await allQuery(
      `SELECT * FROM tokens WHERE department = ? AND status = 'waiting' ORDER BY created_at ASC`,
      [department]
    );
    
    // Get completed today count
    const completedToday = await getQuery(
      `SELECT COUNT(*) as count FROM tokens WHERE department = ? AND status = 'completed' AND date(created_at) = date('now')`,
      [department]
    );
    
    res.json({
      success: true,
      data: {
        department,
        currentCalled: currentCalled,
        waitingCount: waitingCount?.count || 0,
        waitingTokens: waitingTokens,
        completedToday: completedToday?.count || 0
      }
    });
  } catch (error) {
    console.error('Error getting department status:', error);
    next(error);
  }
};

module.exports = {
  generateToken,
  getTokens,
  getTokenById: getTokenByIdRoute,
  updateTokenStatus,
  getTokensByDepartment,
  updateToken,
  getDailyStats,
  getTokenById,
  callNextToken,
  getDepartmentStatus,
  checkAndAutoComplete,
  autoCallNextToken
};