const mongoose = require('mongoose');

const PatientSchema = new mongoose.Schema({
  phoneNumber: { type: String, required: true },
  name: { type: String, required: true },
  age: { type: Number },
  department: { type: String },
  departmentName: { type: String },
  token: { type: String },
  roomNumber: { type: String },
  language: { type: String, default: 'EN' },
  status: { type: String, default: 'active' }
}, { timestamps: true });

module.exports = mongoose.model('Patient', PatientSchema);