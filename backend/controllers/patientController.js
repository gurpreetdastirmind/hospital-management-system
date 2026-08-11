// backend/controllers/patientController.js
const { runQuery, getQuery, allQuery } = require('../database');

// Generate random token (fallback)
const generateToken = () => {
  const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K', 'L', 'M', 'N', 'P', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];
  const letter = letters[Math.floor(Math.random() * letters.length)];
  const number = Math.floor(Math.random() * 90) + 10;
  return `${letter}-${number}`;
};

// Generate random room number (fallback)
const generateRoom = () => {
  return Math.floor(Math.random() * 20) + 1;
};

// Save patient data
const savePatient = async (req, res, next) => {
  try {
    const { 
      language, 
      phoneNumber, 
      name, 
      age, 
      department, 
      departmentName,
      token,
      roomNumber
    } = req.body;

    console.log('📝 Saving patient with data:', { phoneNumber, name, age, department, departmentName, token, roomNumber });

    // Validate required fields
    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        error: 'Phone number is required'
      });
    }

    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Name is required'
      });
    }

    // Use the token from frontend if provided, otherwise generate new ones
    let finalToken = token || generateToken();
    let finalRoom = roomNumber || generateRoom();

    // Get department display name
    let deptDisplayName = departmentName || department || 'General';
    
    const deptMap = {
      'general': 'General',
      'dental': 'Dental',
      'eye': 'Eye',
      'bones': 'Bones',
      'child': 'Child',
      'women': 'Women'
    };
    
    if (department && !departmentName && deptMap[department.toLowerCase()]) {
      deptDisplayName = deptMap[department.toLowerCase()];
    }

    console.log('✅ Saving with token:', finalToken);
    console.log('✅ Saving with room:', finalRoom);
    console.log('✅ Saving with department:', deptDisplayName);

    // Insert into patients table
    const patientSql = `
      INSERT INTO patients (
        phone_number, name, age, department, department_name, 
        token, room_number, language, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `;
    
    const patientResult = await runQuery(patientSql, [
      phoneNumber,
      name,
      age || null,
      department || deptDisplayName,
      deptDisplayName,
      finalToken,
      finalRoom,
      language || 'EN'
    ]);

    const patientId = patientResult.lastID || patientResult.lastInsertRowid;

    // Also save to tokens table for staff portal
    const tokenSql = `
      INSERT INTO tokens (
        token_number, patient_name, phone_number, age, department, 
        room_number, source, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'waiting', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `;
    
    await runQuery(tokenSql, [
      finalToken,
      name,
      phoneNumber,
      age || null,
      deptDisplayName,
      finalRoom,
      'App'
    ]);

    // Get the saved patient
    const savedPatient = await getQuery(
      `SELECT * FROM patients WHERE id = ?`,
      [patientId]
    );

    console.log('✅ Patient saved successfully:', savedPatient);

    res.status(201).json({
      success: true,
      message: 'Patient registered successfully',
      data: {
        ...savedPatient,
        token: finalToken,
        roomNumber: finalRoom,
        departmentName: deptDisplayName
      }
    });
  } catch (error) {
    console.error('❌ Error in savePatient:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to save patient'
    });
  }
};

// Get patient by ID
const getPatient = async (req, res, next) => {
  try {
    const { id } = req.params;
    const patient = await getQuery(
      `SELECT * FROM patients WHERE id = ?`,
      [id]
    );

    if (!patient) {
      return res.status(404).json({
        success: false,
        error: 'Patient not found'
      });
    }

    res.json({
      success: true,
      data: patient
    });
  } catch (error) {
    console.error('Error in getPatient:', error);
    next(error);
  }
};

// Get patient by phone number
const getPatientByPhone = async (req, res, next) => {
  try {
    const { phone } = req.params;
    
    console.log(`🔍 Looking for patient with phone: ${phone}`);
    
    const patient = await getQuery(
      `SELECT * FROM patients WHERE phone_number = ?`,
      [phone]
    );

    if (!patient) {
      console.log(`❌ Patient not found with phone: ${phone}`);
      return res.status(404).json({
        success: false,
        error: 'Patient not found'
      });
    }

    console.log(`✅ Found patient:`, patient);

    res.json({
      success: true,
      data: patient
    });
  } catch (error) {
    console.error('Error in getPatientByPhone:', error);
    next(error);
  }
};

// Get all patients
const getAllPatients = async (req, res, next) => {
  try {
    const { limit = 100, offset = 0 } = req.query;
    
    const patients = await allQuery(`
      SELECT * FROM patients 
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?
    `, [parseInt(limit), parseInt(offset)]);
    
    res.json({
      success: true,
      data: patients,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        count: patients.length
      }
    });
  } catch (error) {
    console.error('Error in getAllPatients:', error);
    next(error);
  }
};

// Update patient
const updatePatient = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, age, department, department_name, phone_number, language, status } = req.body;

    // Check if patient exists
    const existing = await getQuery(
      `SELECT * FROM patients WHERE id = ?`,
      [id]
    );
    
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'Patient not found'
      });
    }

    const updates = [];
    const params = [];

    if (name) {
      updates.push('name = ?');
      params.push(name);
    }
    if (age !== undefined) {
      updates.push('age = ?');
      params.push(age);
    }
    if (department) {
      updates.push('department = ?');
      params.push(department);
    }
    if (department_name) {
      updates.push('department_name = ?');
      params.push(department_name);
    }
    if (phone_number) {
      updates.push('phone_number = ?');
      params.push(phone_number);
    }
    if (language) {
      updates.push('language = ?');
      params.push(language);
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

    const sql = `UPDATE patients SET ${updates.join(', ')} WHERE id = ?`;
    await runQuery(sql, params);

    const updatedPatient = await getQuery(
      `SELECT * FROM patients WHERE id = ?`,
      [id]
    );

    res.json({
      success: true,
      message: 'Patient updated successfully',
      data: updatedPatient
    });
  } catch (error) {
    console.error('Error in updatePatient:', error);
    next(error);
  }
};

// Delete patient
const deletePatient = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if patient exists
    const existing = await getQuery(
      `SELECT * FROM patients WHERE id = ?`,
      [id]
    );
    
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'Patient not found'
      });
    }

    await runQuery(
      `DELETE FROM patients WHERE id = ?`,
      [id]
    );

    res.json({
      success: true,
      message: 'Patient deleted successfully'
    });
  } catch (error) {
    console.error('Error in deletePatient:', error);
    next(error);
  }
};

// Get patient statistics
const getStats = async (req, res, next) => {
  try {
    const stats = await getQuery(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active,
        COUNT(CASE WHEN status = 'inactive' THEN 1 END) as inactive,
        COUNT(DISTINCT department) as departments
      FROM patients
    `);
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error in getStats:', error);
    next(error);
  }
};

module.exports = {
  savePatient,
  getPatient,
  getPatientByPhone,
  getAllPatients,
  updatePatient,
  deletePatient,
  getStats
};