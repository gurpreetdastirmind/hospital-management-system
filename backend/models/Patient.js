const { db, runQuery, getQuery, allQuery } = require('../database');

class Patient {
  // Save new patient
  static async save(patientData) {
    const {
      phoneNumber,
      name,
      age,
      department,
      departmentName,
      token,
      roomNumber,
      language
    } = patientData;

    const sql = `
      INSERT INTO patients (
        phone_number, name, age, department, department_name,
        token, room_number, language, registration_date
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `;

    const params = [
      phoneNumber,
      name,
      age || null,
      department || null,
      departmentName || null,
      token || null,
      roomNumber || null,
      language || 'EN'
    ];

    try {
      const result = await runQuery(sql, params);
      return result.lastID;
    } catch (error) {
      console.error('Error saving patient:', error);
      throw error;
    }
  }

  // Get patient by ID
  static async findById(id) {
    const sql = `SELECT * FROM patients WHERE id = ?`;
    try {
      const patient = await getQuery(sql, [id]);
      return patient;
    } catch (error) {
      console.error('Error finding patient:', error);
      throw error;
    }
  }

  // Get patient by phone number
  static async findByPhone(phoneNumber) {
    const sql = `SELECT * FROM patients WHERE phone_number = ? ORDER BY registration_date DESC LIMIT 1`;
    try {
      const patient = await getQuery(sql, [phoneNumber]);
      return patient;
    } catch (error) {
      console.error('Error finding patient by phone:', error);
      throw error;
    }
  }

  // Get all patients with pagination
  static async findAll(limit = 100, offset = 0) {
    const sql = `
      SELECT * FROM patients 
      ORDER BY registration_date DESC 
      LIMIT ? OFFSET ?
    `;
    try {
      const patients = await allQuery(sql, [limit, offset]);
      return patients;
    } catch (error) {
      console.error('Error finding all patients:', error);
      throw error;
    }
  }

  // Update patient
  static async update(id, updateData) {
    const fields = [];
    const values = [];

    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined && updateData[key] !== null) {
        fields.push(`${key} = ?`);
        values.push(updateData[key]);
      }
    });

    if (fields.length === 0) {
      throw new Error('No fields to update');
    }

    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    const sql = `UPDATE patients SET ${fields.join(', ')} WHERE id = ?`;
    
    try {
      const result = await runQuery(sql, values);
      return result.changes;
    } catch (error) {
      console.error('Error updating patient:', error);
      throw error;
    }
  }

  // Delete patient (soft delete)
  static async delete(id) {
    const sql = `UPDATE patients SET status = 'inactive', updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
    try {
      const result = await runQuery(sql, [id]);
      return result.changes;
    } catch (error) {
      console.error('Error deleting patient:', error);
      throw error;
    }
  }

  // Get patient statistics
  static async getStats() {
    const sql = `
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active,
        COUNT(CASE WHEN status = 'inactive' THEN 1 END) as inactive,
        COUNT(CASE WHEN age IS NOT NULL THEN 1 END) as with_age,
        COUNT(CASE WHEN department IS NOT NULL THEN 1 END) as with_department
      FROM patients
    `;
    try {
      const stats = await getQuery(sql);
      return stats;
    } catch (error) {
      console.error('Error getting stats:', error);
      throw error;
    }
  }
}

module.exports = Patient;