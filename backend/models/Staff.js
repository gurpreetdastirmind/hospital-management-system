const mongoose = require('mongoose');
const crypto = require('crypto');

const StaffSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: 'staff' },
  status: { type: String, default: 'active' },
  last_login: { type: Date }
}, { timestamps: true });

// Helper static method to hash password
StaffSchema.statics.hashPassword = (password) => {
  return crypto.createHash('sha256').update(password).digest('hex');
};

module.exports = mongoose.model('Staff', StaffSchema);