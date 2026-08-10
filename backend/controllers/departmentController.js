const { db, runQuery, getQuery, allQuery } = require('../database');

// Get all departments
const getDepartments = async (req, res, next) => {
  try {
    const sql = `SELECT * FROM departments ORDER BY name`;
    const departments = await allQuery(sql);
    
    // Get waiting counts for each department
    for (let dept of departments) {
      const countSql = `
        SELECT COUNT(*) as waiting 
        FROM tokens 
        WHERE department = ? AND status = 'waiting'
      `;
      const count = await getQuery(countSql, [dept.name]);
      dept.waiting = count?.waiting || 0;
    }
    
    res.json({
      success: true,
      data: departments
    });
  } catch (error) {
    console.error('Error getting departments:', error);
    next(error);
  }
};

// Get department by ID
const getDepartmentById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const sql = `SELECT * FROM departments WHERE id = ?`;
    const department = await getQuery(sql, [id]);
    
    if (!department) {
      return res.status(404).json({
        success: false,
        error: 'Department not found'
      });
    }
    
    res.json({
      success: true,
      data: department
    });
  } catch (error) {
    console.error('Error getting department:', error);
    next(error);
  }
};

// Create department
const createDepartment = async (req, res, next) => {
  try {
    const { name, room, tokenPrefix, icon, color, isOpen } = req.body;
    
    if (!name || !room) {
      return res.status(400).json({
        success: false,
        error: 'Name and room are required'
      });
    }
    
    const sql = `
      INSERT INTO departments (name, room, token_prefix, icon, color, is_open, created_at)
      VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `;
    
    const result = await runQuery(sql, [
      name, 
      room, 
      tokenPrefix || name.substring(0, 1).toUpperCase(),
      icon || '🏥',
      color || '#4CAF50',
      isOpen !== undefined ? (isOpen ? 1 : 0) : 1
    ]);
    
    const newDepartment = await getDepartmentById(result.lastID);
    
    res.status(201).json({
      success: true,
      message: 'Department created successfully',
      data: newDepartment
    });
  } catch (error) {
    console.error('Error creating department:', error);
    next(error);
  }
};

// Update department
const updateDepartment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, room, tokenPrefix, icon, color, isOpen } = req.body;
    
    const sql = `
      UPDATE departments 
      SET name = ?, room = ?, token_prefix = ?, icon = ?, color = ?, is_open = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    
    const result = await runQuery(sql, [
      name, 
      room, 
      tokenPrefix || name.substring(0, 1).toUpperCase(),
      icon || '🏥',
      color || '#4CAF50',
      isOpen !== undefined ? (isOpen ? 1 : 0) : 1,
      id
    ]);
    
    if (result.changes === 0) {
      return res.status(404).json({
        success: false,
        error: 'Department not found'
      });
    }
    
    const updatedDepartment = await getDepartmentById(id);
    
    res.json({
      success: true,
      message: 'Department updated successfully',
      data: updatedDepartment
    });
  } catch (error) {
    console.error('Error updating department:', error);
    next(error);
  }
};

// Delete department
const deleteDepartment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const sql = `DELETE FROM departments WHERE id = ?`;
    const result = await runQuery(sql, [id]);
    
    if (result.changes === 0) {
      return res.status(404).json({
        success: false,
        error: 'Department not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Department deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting department:', error);
    next(error);
  }
};

// Toggle department status
const toggleDepartment = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const department = await getDepartmentById(id);
    if (!department) {
      return res.status(404).json({
        success: false,
        error: 'Department not found'
      });
    }
    
    const newStatus = department.is_open === 1 ? 0 : 1;
    const sql = `UPDATE departments SET is_open = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
    await runQuery(sql, [newStatus, id]);
    
    const updatedDepartment = await getDepartmentById(id);
    
    res.json({
      success: true,
      message: `Department ${newStatus === 1 ? 'opened' : 'closed'} successfully`,
      data: updatedDepartment
    });
  } catch (error) {
    console.error('Error toggling department:', error);
    next(error);
  }
};

module.exports = {
  getDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  toggleDepartment
};