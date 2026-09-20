const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['player', 'organizer'], default: 'player' },
  otpHash: { type: String, default: null },
  otpExpiresAt: { type: Date, default: null },
  otpLastSentAt: { type: Date, default: null },
  otpAttempts: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);