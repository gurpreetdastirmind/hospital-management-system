const Patient = require('../models/Patient');
const { runQuery } = require('../database');

// Generate random token
const generateToken = () => {
  const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K', 'L', 'M', 'N', 'P', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];
  const letter = letters[Math.floor(Math.random() * letters.length)];
  const number = Math.floor(Math.random() * 90) + 10;
  return `${letter}-${number}`;
};

// Generate random room number
const generateRoom = () => {
  return Math.floor(Math.random() * 20) + 1;
};

// Save patient data
// In patientController.js, modify the savePatient function
const savePatient = async (req, res, next) => {
  try {
    const { 
      language, 
      phoneNumber, 
      name, 
      age, 
      department, 
      departmentName,
      token,      // ← Add this
      roomNumber  // ← Add this
    } = req.body;

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

    // Use the token from frontend if provided, otherwise generate new one
    let finalToken = token;
    let finalRoom = roomNumber;

    // If token not provided, generate new ones (for backward compatibility)
    if (!finalToken) {
      finalToken = generateToken();
    }
    if (!finalRoom) {
      finalRoom = generateRoom();
    }

    // IMPORTANT: Use departmentName as the display name
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

    console.log('Saving with token:', finalToken);
    console.log('Saving with room:', finalRoom);
    console.log('Saving with department:', deptDisplayName);

    // Prepare patient data
    const patientData = {
      phoneNumber,
      name,
      age: age || null,
      department: department || deptDisplayName,
      departmentName: deptDisplayName,
      token: finalToken,      // ← Use the frontend token
      roomNumber: finalRoom,  // ← Use the frontend room
      language: language || 'EN'
    };

    // Save patient to patients table
    const patientId = await Patient.save(patientData);

    // ALSO save to tokens table for staff portal
    const tokenSql = `
      INSERT INTO tokens (
        token_number, patient_name, phone_number, age, department, 
        room_number, source, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'waiting', CURRENT_TIMESTAMP)
    `;
    
    await runQuery(tokenSql, [
      finalToken,       // ← Use the same token
      name,
      phoneNumber,
      age || null,
      deptDisplayName,
      finalRoom,        // ← Use the same room
      'App'
    ]);

    // Get the saved patient
    const savedPatient = await Patient.findById(patientId);

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
    console.error('Error in savePatient:', error);
    next(error);
  }
};

// Get patient by ID
const getPatient = async (req, res, next) => {
  try {
    const { id } = req.params;
    const patient = await Patient.findById(id);

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
    const patient = await Patient.findByPhone(phone);

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
    console.error('Error in getPatientByPhone:', error);
    next(error);
  }
};

// Get all patients
const getAllPatients = async (req, res, next) => {
  try {
    const { limit = 100, offset = 0 } = req.query;
    const patients = await Patient.findAll(parseInt(limit), parseInt(offset));
    
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
    const updateData = req.body;

    // Check if patient exists
    const existingPatient = await Patient.findById(id);
    if (!existingPatient) {
      return res.status(404).json({
        success: false,
        error: 'Patient not found'
      });
    }

    const changes = await Patient.update(id, updateData);
    
    if (changes === 0) {
      return res.status(400).json({
        success: false,
        error: 'No changes made'
      });
    }

    const updatedPatient = await Patient.findById(id);

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
    const existingPatient = await Patient.findById(id);
    if (!existingPatient) {
      return res.status(404).json({
        success: false,
        error: 'Patient not found'
      });
    }

    const changes = await Patient.delete(id);
    
    if (changes === 0) {
      return res.status(400).json({
        success: false,
        error: 'Patient could not be deleted'
      });
    }

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
    const stats = await Patient.getStats();
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