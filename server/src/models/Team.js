const mongoose = require('mongoose');

// No _id on roster entries — they're only ever read as part of the parent Team,
// never queried independently.
const rosterMemberSchema = new mongoose.Schema({
  playerId: { type: mongoose.Schema.Types.ObjectId, ref: 'PlayerProfile', required: true },
  role: { type: String, trim: true },
  joinedAt: { type: Date, default: Date.now },
  leftAt: { type: Date, default: null }
}, { _id: false });

const teamSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  logoUrl: { type: String, default: null },
  discipline: { type: String, enum: ['cricket', 'pubg', 'football'], required: true },
  captainUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  roster: [rosterMemberSchema]
}, { timestamps: true });

module.exports = mongoose.model('Team', teamSchema);