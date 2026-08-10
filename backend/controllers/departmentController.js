const Department = require('../models/Department');
const Token = require('../models/Token');

// Get all departments
const getDepartments = async (req, res, next) => {
  try {
    const departments = await Department.find().sort({ name: 1 });
    
    // Get waiting counts for each department
    for (let dept of departments) {
      const count = await Token.countDocuments({ 
        department: dept.name, 
        status: 'waiting' 
      });
      dept = dept.toObject();
      dept.waiting = count;
    }
    
    res.json({ success: true, data: departments });
  } catch (error) {
    console.error('Error getting departments:', error);
    next(error);
  }
};

// Get department by ID
const getDepartmentById = async (req, res, next) => {
  try {
    const department = await Department.findById(req.params.id);
    if (!department) {
      return res.status(404).json({ success: false, error: 'Department not found' });
    }
    res.json({ success: true, data: department });
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
      return res.status(400).json({ success: false, error: 'Name and room are required' });
    }

    const newDepartment = new Department({
      name, room, tokenPrefix: tokenPrefix || name.substring(0, 1).toUpperCase(),
      icon: icon || '🏥', color: color || '#4CAF50', isOpen: isOpen !== undefined ? isOpen : true
    });
    await newDepartment.save();

    res.status(201).json({ success: true, message: 'Department created successfully', data: newDepartment });
  } catch (error) {
    console.error('Error creating department:', error);
    next(error);
  }
};

// Update department
const updateDepartment = async (req, res, next) => {
  try {
    const { name, room, tokenPrefix, icon, color, isOpen } = req.body;
    
    const updatedDepartment = await Department.findByIdAndUpdate(
      req.params.id,
      { name, room, tokenPrefix, icon, color, isOpen },
      { new: true, runValidators: true }
    );

    if (!updatedDepartment) {
      return res.status(404).json({ success: false, error: 'Department not found' });
    }

    res.json({ success: true, message: 'Department updated successfully', data: updatedDepartment });
  } catch (error) {
    console.error('Error updating department:', error);
    next(error);
  }
};

// Delete department
const deleteDepartment = async (req, res, next) => {
  try {
    const result = await Department.findByIdAndDelete(req.params.id);
    if (!result) {
      return res.status(404).json({ success: false, error: 'Department not found' });
    }
    res.json({ success: true, message: 'Department deleted successfully' });
  } catch (error) {
    console.error('Error deleting department:', error);
    next(error);
  }
};

// Toggle department status
const toggleDepartment = async (req, res, next) => {
  try {
    const department = await Department.findById(req.params.id);
    if (!department) {
      return res.status(404).json({ success: false, error: 'Department not found' });
    }
    
    department.isOpen = !department.isOpen;
    await department.save();

    res.json({
      success: true,
      message: `Department ${department.isOpen ? 'opened' : 'closed'} successfully`,
      data: department
    });
  } catch (error) {
    console.error('Error toggling department:', error);
    next(error);
  }
};

module.exports = { getDepartments, getDepartmentById, createDepartment, updateDepartment, deleteDepartment, toggleDepartment };