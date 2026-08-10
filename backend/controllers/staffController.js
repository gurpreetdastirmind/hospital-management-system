const Staff = require('../models/Staff');

// Staff login
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required' });
    }

    const staff = await Staff.findOne({ email, status: 'active' });
    if (!staff) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    const hashedPassword = Staff.hashPassword(password);
    if (staff.password !== hashedPassword) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    staff.last_login = new Date();
    await staff.save();

    res.json({
      success: true, message: 'Login successful',
      data: { id: staff._id, name: staff.name, email: staff.email, role: staff.role }
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
      return res.status(400).json({ success: false, error: 'Name, email and password are required' });
    }

    const existingStaff = await Staff.findOne({ email });
    if (existingStaff) {
      return res.status(400).json({ success: false, error: 'Email already registered' });
    }

    const hashedPassword = Staff.hashPassword(password);
    const newStaff = new Staff({ name, email, password: hashedPassword, role });
    await newStaff.save();

    res.status(201).json({ success: true, message: 'Staff registered successfully', data: { id: newStaff._id, name, email, role } });
  } catch (error) {
    console.error('Error in register:', error);
    next(error);
  }
};

// Get staff profile
const getProfile = async (req, res, next) => {
  try {
    const staff = await Staff.findById(req.query.id).select('-password');
    if (!staff) {
      return res.status(404).json({ success: false, error: 'Staff not found' });
    }
    res.json({ success: true, data: staff });
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
      return res.status(400).json({ success: false, error: 'Staff ID required' });
    }

    const staff = await Staff.findByIdAndUpdate(id, { name, email, role, status }, { new: true, runValidators: true });
    if (!staff) {
      return res.status(404).json({ success: false, error: 'Staff not found' });
    }

    res.json({ success: true, message: 'Profile updated successfully', data: staff });
  } catch (error) {
    console.error('Error in updateProfile:', error);
    next(error);
  }
};

// Get all staff
const getAllStaff = async (req, res, next) => {
  try {
    const staff = await Staff.find().select('-password').sort({ createdAt: -1 });
    res.json({ success: true, data: staff });
  } catch (error) {
    console.error('Error in getAllStaff:', error);
    next(error);
  }
};

// Delete staff
const deleteStaff = async (req, res, next) => {
  try {
    const result = await Staff.findByIdAndDelete(req.params.id);
    if (!result) {
      return res.status(404).json({ success: false, error: 'Staff not found' });
    }
    res.json({ success: true, message: 'Staff deleted successfully' });
  } catch (error) {
    console.error('Error in deleteStaff:', error);
    next(error);
  }
};

module.exports = { login, register, getProfile, updateProfile, getAllStaff, deleteStaff };