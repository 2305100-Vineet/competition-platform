const mongoose = require('mongoose');

const playerProfileSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  discipline: { type: String, enum: ['cricket', 'pubg', 'football'], required: true },
  displayName: { type: String, required: true, trim: true },
  gamertag: { type: String, trim: true, default: null },
  country: { type: String, trim: true, default: null },
  avatarUrl: { type: String, default: null }
}, { timestamps: true });

// One profile per user per discipline — a user can have a cricket profile
// and a separate PUBG profile, but not two of the same discipline.
playerProfileSchema.index({ userId: 1, discipline: 1 }, { unique: true });

module.exports = mongoose.model('PlayerProfile', playerProfileSchema);