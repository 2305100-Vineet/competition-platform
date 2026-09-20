const mongoose = require('mongoose');

const matchParticipantSchema = new mongoose.Schema({
  teamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
  teamNameSnapshot: { type: String, required: true },
  rosterSnapshot: [{ playerId: mongoose.Schema.Types.ObjectId, name: String, role: String }],
  seed: { type: Number, default: null }
}, { _id: false });

const outcomeEntrySchema = new mongoose.Schema({
  teamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
  rank: { type: Number, required: true },
  points: { type: Number, required: true },
  displayStat: { type: String, default: null }
}, { _id: false });

const matchSchema = new mongoose.Schema({
  tournamentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tournament', required: true },
  discipline: { type: String, enum: ['cricket', 'pubg', 'football'], required: true },
  format: { type: String, enum: ['round_robin', 'single_elimination', 'points_league'], required: true },
  round: { type: Number, default: null },
  roundLabel: { type: String, default: null },

  // Bracket progression pointer — set only for single_elimination matches.
  // The winner gets pushed into nextMatch.participants when this match completes.
  nextMatchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Match', default: null },

  participants: [matchParticipantSchema],

  status: { type: String, enum: ['Scheduled', 'Completed'], default: 'Scheduled' },
  scheduledAt: { type: Date, default: null },

  meta: { type: mongoose.Schema.Types.Mixed, default: null },
  rawResult: { type: mongoose.Schema.Types.Mixed, default: null },

  outcome: [outcomeEntrySchema],
  resultVersion: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Match', matchSchema);