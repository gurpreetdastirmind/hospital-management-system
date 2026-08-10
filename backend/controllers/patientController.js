const Patient = require('../models/Patient');
const Token = require('../models/Token');

const generateTokenNumber = async (department) => {
  const today = new Date();
  today.setHours(0,0,0,0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const lastToken = await Token.findOne({ 
    department, 
    createdAt: { $gte: today, $lt: tomorrow } 
  }).sort({ token_number: -1 });
  
  if (lastToken) {
    const parts = lastToken.token_number.split('-');
    const num = parseInt(parts[parts.length - 1]) + 1;
    const prefix = department.substring(0, 1).toUpperCase();
    return `${prefix}-${String(num).padStart(2, '0')}`;
  }
  const prefix = department.substring(0, 1).toUpperCase();
  return `${prefix}-01`;
};

// Save patient data
const savePatient = async (req, res, next) => {
  try {
    const { language, phoneNumber, name, age, department, departmentName, token, roomNumber } = req.body;

    if (!phoneNumber || !name) {
      return res.status(400).json({ success: false, error: 'Phone and Name are required' });
    }

    let finalToken = token || await generateTokenNumber(department);
    let finalRoom = roomNumber || Math.floor(Math.random() * 20) + 1;
    
    let deptDisplayName = departmentName || department || 'General';
    const deptMap = { 'general': 'General', 'dental': 'Dental', 'eye': 'Eye', 'bones': 'Bones', 'child': 'Child', 'women': 'Women' };
    if (department && !departmentName && deptMap[department.toLowerCase()]) {
      deptDisplayName = deptMap[department.toLowerCase()];
    }

    const patientData = new Patient({
      phoneNumber, name, age: age || null, department: department || deptDisplayName,
      departmentName: deptDisplayName, token: finalToken, roomNumber: finalRoom, language: language || 'EN'
    });
    await patientData.save();

    const newToken = new Token({
      token_number: finalToken, patient_name: name, phone_number: phoneNumber, age: age || null,
      department: deptDisplayName, room_number: finalRoom, source: 'App', status: 'waiting'
    });
    await newToken.save();

    res.status(201).json({
      success: true, message: 'Patient registered successfully',
      data: { ...patientData._doc, token: finalToken, roomNumber: finalRoom, departmentName: deptDisplayName }
    });
  } catch (error) {
    console.error('Error in savePatient:', error);
    next(error);
  }
};

const getPatient = async (req, res, next) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) return res.status(404).json({ success: false, error: 'Patient not found' });
    res.json({ success: true, data: patient });
  } catch (error) { next(error); }
};

const getPatientByPhone = async (req, res, next) => {
  try {
    const patient = await Patient.findOne({ phoneNumber: req.params.phone });
    if (!patient) return res.status(404).json({ success: false, error: 'Patient not found' });
    res.json({ success: true, data: patient });
  } catch (error) { next(error); }
};

const getAllPatients = async (req, res, next) => {
  try {
    const { limit = 100, offset = 0 } = req.query;
    const patients = await Patient.find().sort({ createdAt: -1 }).limit(parseInt(limit)).skip(parseInt(offset));
    res.json({ success: true, data: patients, pagination: { limit: parseInt(limit), offset: parseInt(offset), count: patients.length } });
  } catch (error) { next(error); }
};

const updatePatient = async (req, res, next) => {
  try {
    const patient = await Patient.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!patient) return res.status(404).json({ success: false, error: 'Patient not found' });
    res.json({ success: true, message: 'Patient updated successfully', data: patient });
  } catch (error) { next(error); }
};

const deletePatient = async (req, res, next) => {
  try {
    const patient = await Patient.findByIdAndDelete(req.params.id);
    if (!patient) return res.status(404).json({ success: false, error: 'Patient not found' });
    res.json({ success: true, message: 'Patient deleted successfully' });
  } catch (error) { next(error); }
};

const getStats = async (req, res, next) => {
  try {
    const total = await Patient.countDocuments();
    const active = await Patient.countDocuments({ status: 'active' });
    const inactive = await Patient.countDocuments({ status: 'inactive' });
    const withAge = await Patient.countDocuments({ age: { $ne: null } });
    const withDept = await Patient.countDocuments({ department: { $ne: null } });

    res.json({ success: true, data: { total, active, inactive, with_age: withAge, with_department: withDept } });
  } catch (error) { next(error); }
};

module.exports = { savePatient, getPatient, getPatientByPhone, getAllPatients, updatePatient, deletePatient, getStats };