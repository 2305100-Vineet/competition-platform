const Registration = require('../models/Registration');
const Tournament = require('../models/Tournament');
const Team = require('../models/Team');

exports.registerTeam = async (req, res) => {
  try {
    const { tournamentId, teamId } = req.body;
    if (!tournamentId || !teamId) {
      return res.status(400).json({ message: 'tournamentId and teamId are required' });
    }

    const tournament = await Tournament.findById(tournamentId);
    if (!tournament) return res.status(404).json({ message: 'Tournament not found' });

    const team = await Team.findById(teamId);
    if (!team) return res.status(404).json({ message: 'Team not found' });

    if (team.captainUserId.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Only the team captain can register this team' });
    }

    if (tournament.status !== 'RegistrationOpen') {
      return res.status(400).json({ message: `Registration is not open (tournament status: ${tournament.status})` });
    }

    if (team.discipline !== tournament.discipline) {
      return res.status(400).json({ message: `Team discipline (${team.discipline}) does not match tournament discipline (${tournament.discipline})` });
    }

    const registration = await Registration.create({ tournamentId, teamId });
    res.status(201).json(registration);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: 'This team has already registered for this tournament' });
    }
    res.status(500).json({ message: err.message });
  }
};

exports.getRegistrationsForTournament = async (req, res) => {
  try {
    const { tournamentId } = req.query;
    if (!tournamentId) return res.status(400).json({ message: 'tournamentId query param is required' });

    const tournament = await Tournament.findById(tournamentId);
    if (!tournament) return res.status(404).json({ message: 'Tournament not found' });

    if (tournament.organizerId.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Only the organizer can view registrations' });
    }

    const registrations = await Registration.find({ tournamentId }).populate('teamId', 'name discipline');
    res.json(registrations);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.approveRegistration = async (req, res) => {
  try {
    const registration = await Registration.findById(req.params.id);
    if (!registration) return res.status(404).json({ message: 'Registration not found' });

    const tournament = await Tournament.findById(registration.tournamentId);
    if (!tournament) return res.status(404).json({ message: 'Tournament not found' });

    if (tournament.organizerId.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Only the organizer can approve registrations' });
    }

    if (registration.status !== 'pending') {
      return res.status(400).json({ message: `Registration is already ${registration.status}` });
    }

    if (!['RegistrationOpen', 'RegistrationClosed'].includes(tournament.status)) {
      return res.status(400).json({ message: `Cannot approve registrations while tournament status is ${tournament.status}` });
    }

    if (tournament.participants.length >= tournament.maxParticipants) {
      return res.status(400).json({ message: 'Tournament has reached maxParticipants' });
    }

    const team = await Team.findById(registration.teamId).populate('roster.playerId');
    if (!team) return res.status(404).json({ message: 'Team not found' });

    // Snapshot taken NOW, from the live roster, at approval time — not from anything
    // stored back when the registration was submitted.
    const rosterSnapshot = team.roster
      .filter((member) => !member.leftAt)
      .map((member) => ({
        playerId: member.playerId._id,
        name: member.playerId.displayName,
        role: member.role
      }));

    tournament.participants.push({
      teamId: team._id,
      teamNameSnapshot: team.name,
      rosterSnapshot,
      seed: null,
      registeredAt: new Date()
    });
    await tournament.save();

    registration.status = 'approved';
    registration.decidedAt = new Date();
    registration.decidedBy = req.user.userId;
    await registration.save();

    res.json({ registration, tournament });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.rejectRegistration = async (req, res) => {
  try {
    const registration = await Registration.findById(req.params.id);
    if (!registration) return res.status(404).json({ message: 'Registration not found' });

    const tournament = await Tournament.findById(registration.tournamentId);
    if (!tournament) return res.status(404).json({ message: 'Tournament not found' });

    if (tournament.organizerId.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Only the organizer can reject registrations' });
    }

    if (registration.status !== 'pending') {
      return res.status(400).json({ message: `Registration is already ${registration.status}` });
    }

    registration.status = 'rejected';
    registration.decidedAt = new Date();
    registration.decidedBy = req.user.userId;
    await registration.save();

    res.json(registration);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};