const Tournament = require('../models/Tournament');

exports.createTournament = async (req, res) => {
  try {
    const { name, discipline, description, bannerUrl, maxParticipants, minParticipants } = req.body;
    if (!name || !discipline || !maxParticipants) {
      return res.status(400).json({ message: 'name, discipline, and maxParticipants are required' });
    }

    const tournament = await Tournament.create({
      name,
      discipline,
      organizerId: req.user.userId,
      description,
      bannerUrl,
      maxParticipants,
      minParticipants
    });
    res.status(201).json(tournament);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getTournaments = async (req, res) => {
  try {
    const filter = {};
    if (req.query.discipline) filter.discipline = req.query.discipline;
    if (req.query.status) filter.status = req.query.status;
    const tournaments = await Tournament.find(filter);
    res.json(tournaments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getTournamentById = async (req, res) => {
  try {
    const tournament = await Tournament.findById(req.params.id);
    if (!tournament) return res.status(404).json({ message: 'Tournament not found' });
    res.json(tournament);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.openRegistration = async (req, res) => {
  try {
    const tournament = await Tournament.findById(req.params.id);
    if (!tournament) return res.status(404).json({ message: 'Tournament not found' });

    if (tournament.organizerId.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Only the organizer can manage this tournament' });
    }

    if (tournament.status !== 'Draft') {
      return res.status(400).json({ message: `Cannot open registration from status ${tournament.status}` });
    }

    tournament.status = 'RegistrationOpen';
    tournament.registrationWindow.opensAt = new Date();
    await tournament.save();

    res.json(tournament);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};