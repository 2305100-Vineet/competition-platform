const mongoose = require('mongoose');

const tournamentSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  discipline: { type: String, enum: ['cricket', 'pubg', 'football'], required: true },
  organizerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  description: { type: String, trim: true, default: null },
  bannerUrl: { type: String, default: null },

  status: {
    type: String,
    enum: [
      'Draft',
      'RegistrationOpen',
      'RegistrationClosed',
      'ParticipantsFinalized',
      'Scheduled',
      'InProgress',
      'Completed'
    ],
    default: 'Draft'
  },

  registrationWindow: {
    opensAt: { type: Date, default: null },
    closesAt: { type: Date, default: null }
  },
  maxParticipants: { type: Number, required: true },
  minParticipants: { type: Number, default: 2 },

  participants: [
    {
      teamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
      teamNameSnapshot: String,
      rosterSnapshot: [{ playerId: mongoose.Schema.Types.ObjectId, name: String, role: String }],
      seed: Number,
      registeredAt: Date
    }
  ],

  // Mixed, not a typed subschema — the standings shape differs by format
  // (round_robin: played/won/lost/tied/points; points_league:
  // matchesPlayed/totalPoints/bestPlacement). A strict subschema silently
  // strips fields it doesn't recognize, which is exactly what was zeroing
  // out every PUBG tournament's standings. Mixed stores whatever shape
  // recomputeStandings() produces, as-is.
  standings: { type: mongoose.Schema.Types.Mixed, default: [] },

  stages: [{ type: mongoose.Schema.Types.Mixed }]
}, { timestamps: true });

module.exports = mongoose.model('Tournament', tournamentSchema);