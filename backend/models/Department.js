const mongoose = require('mongoose');

const DepartmentSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  room: { type: String, required: true },
  tokenPrefix: { type: String },
  icon: { type: String, default: '🏥' },
  color: { type: String, default: '#4CAF50' },
  isOpen: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Department', DepartmentSchema);