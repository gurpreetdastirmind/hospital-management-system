// backend/routes/doctors.js
const express = require('express');
const router = express.Router();
const { db, runQuery, getQuery, allQuery } = require('../database');

// Get all doctors
router.get('/', async (req, res) => {
  try {
    const doctors = await allQuery(`
      SELECT d.*, dept.room as department_room 
      FROM doctors d
      LEFT JOIN departments dept ON d.department = dept.name
      ORDER BY d.name ASC
    `);
    
    res.json({
      success: true,
      data: doctors
    });
  } catch (error) {
    console.error('Error fetching doctors:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch doctors'
    });
  }
});

// Get single doctor by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const doctor = await getQuery(`
      SELECT d.*, dept.room as department_room 
      FROM doctors d
      LEFT JOIN departments dept ON d.department = dept.name
      WHERE d.id = ?
    `, [id]);
    
    if (!doctor) {
      return res.status(404).json({
        success: false,
        error: 'Doctor not found'
      });
    }
    
    res.json({
      success: true,
      data: doctor
    });
  } catch (error) {
    console.error('Error fetching doctor:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch doctor'
    });
  }
});

// Create new doctor
router.post('/', async (req, res) => {
  try {
    const { 
      name, 
      specialization, 
      department, 
      phone, 
      email, 
      qualification, 
      experience, 
      status = 'active' 
    } = req.body;

    // Validate required fields
    if (!name || !specialization || !department) {
      return res.status(400).json({
        success: false,
        error: 'Name, specialization, and department are required'
      });
    }

    // Check if doctor already exists
    const existingDoctor = await getQuery(`
      SELECT * FROM doctors WHERE name = ? AND department = ?
    `, [name, department]);

    if (existingDoctor) {
      return res.status(400).json({
        success: false,
        error: 'Doctor already exists in this department'
      });
    }

    // Insert new doctor
    const result = await runQuery(`
      INSERT INTO doctors (
        name, specialization, department, phone, email, 
        qualification, experience, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      name, 
      specialization, 
      department, 
      phone || null, 
      email || null, 
      qualification || null, 
      experience || null, 
      status
    ]);

    // Get the newly created doctor
    const newDoctor = await getQuery(`
      SELECT d.*, dept.room as department_room 
      FROM doctors d
      LEFT JOIN departments dept ON d.department = dept.name
      WHERE d.id = ?
    `, [result.lastID]);

    res.status(201).json({
      success: true,
      message: 'Doctor added successfully',
      data: newDoctor
    });

  } catch (error) {
    console.error('Error creating doctor:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create doctor'
    });
  }
});

// Update doctor
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      name, 
      specialization, 
      department, 
      phone, 
      email, 
      qualification, 
      experience, 
      status 
    } = req.body;

    // Check if doctor exists
    const existing = await getQuery(`
      SELECT * FROM doctors WHERE id = ?
    `, [id]);

    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'Doctor not found'
      });
    }

    // Update doctor
    await runQuery(`
      UPDATE doctors SET 
        name = ?,
        specialization = ?,
        department = ?,
        phone = ?,
        email = ?,
        qualification = ?,
        experience = ?,
        status = ?,
        updated_at = datetime('now')
      WHERE id = ?
    `, [
      name || existing.name,
      specialization || existing.specialization,
      department || existing.department,
      phone || existing.phone,
      email || existing.email,
      qualification || existing.qualification,
      experience || existing.experience,
      status || existing.status,
      id
    ]);

    // Get updated doctor
    const updatedDoctor = await getQuery(`
      SELECT d.*, dept.room as department_room 
      FROM doctors d
      LEFT JOIN departments dept ON d.department = dept.name
      WHERE d.id = ?
    `, [id]);

    res.json({
      success: true,
      message: 'Doctor updated successfully',
      data: updatedDoctor
    });

  } catch (error) {
    console.error('Error updating doctor:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update doctor'
    });
  }
});

// Toggle doctor status (active/inactive)
router.patch('/:id/toggle-status', async (req, res) => {
  try {
    const { id } = req.params;

    // Get current doctor
    const doctor = await getQuery(`
      SELECT * FROM doctors WHERE id = ?
    `, [id]);

    if (!doctor) {
      return res.status(404).json({
        success: false,
        error: 'Doctor not found'
      });
    }

    // Toggle status
    const newStatus = doctor.status === 'active' ? 'inactive' : 'active';
    
    await runQuery(`
      UPDATE doctors SET 
        status = ?,
        updated_at = datetime('now')
      WHERE id = ?
    `, [newStatus, id]);

    res.json({
      success: true,
      message: `Doctor ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`,
      data: { id, status: newStatus }
    });

  } catch (error) {
    console.error('Error toggling doctor status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to toggle doctor status'
    });
  }
});

// Delete doctor
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if doctor exists
    const doctor = await getQuery(`
      SELECT * FROM doctors WHERE id = ?
    `, [id]);

    if (!doctor) {
      return res.status(404).json({
        success: false,
        error: 'Doctor not found'
      });
    }

    // Delete doctor
    await runQuery(`
      DELETE FROM doctors WHERE id = ?
    `, [id]);

    res.json({
      success: true,
      message: 'Doctor deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting doctor:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete doctor'
    });
  }
});

// Get doctors by department
router.get('/department/:department', async (req, res) => {
  try {
    const { department } = req.params;
    
    const doctors = await allQuery(`
      SELECT d.*, dept.room as department_room 
      FROM doctors d
      LEFT JOIN departments dept ON d.department = dept.name
      WHERE d.department = ? AND d.status = 'active'
      ORDER BY d.name ASC
    `, [department]);
    
    res.json({
      success: true,
      data: doctors
    });
  } catch (error) {
    console.error('Error fetching doctors by department:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch doctors'
    });
  }
});

module.exports = router;