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

  // Recomputed from scratch after every result submission — round-robin only for now.
  standings: [
    {
      teamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
      teamNameSnapshot: String,
      played: { type: Number, default: 0 },
      won: { type: Number, default: 0 },
      lost: { type: Number, default: 0 },
      tied: { type: Number, default: 0 },
      points: { type: Number, default: 0 }
    }
  ],

  stages: [{ type: mongoose.Schema.Types.Mixed }]
}, { timestamps: true });

module.exports = mongoose.model('Tournament', tournamentSchema);