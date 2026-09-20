const mongoose = require('mongoose');

const registrationSchema = new mongoose.Schema({
  tournamentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tournament', required: true },
  teamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  decidedAt: { type: Date, default: null },
  decidedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
}, { timestamps: true });

// A team can only have one registration per tournament — no duplicate applications.
registrationSchema.index({ tournamentId: 1, teamId: 1 }, { unique: true });

module.exports = mongoose.model('Registration', registrationSchema);