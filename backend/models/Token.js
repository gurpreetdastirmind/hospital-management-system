const mongoose = require('mongoose');

const TokenSchema = new mongoose.Schema({
  token_number: { type: String, required: true, unique: true },
  patient_name: { type: String, required: true },
  phone_number: { type: String, required: true },
  age: { type: Number },
  department: { type: String, required: true },
  room_number: { type: String },
  source: { type: String, default: 'App' },
  status: { type: String, enum: ['waiting', 'called', 'completed', 'missed'], default: 'waiting' }
}, { timestamps: true });

module.exports = mongoose.model('Token', TokenSchema);