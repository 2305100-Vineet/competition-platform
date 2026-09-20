const PlayerProfile = require('../models/PlayerProfile');

exports.createPlayerProfile = async (req, res) => {
  try {
    const { discipline, displayName, gamertag, country, avatarUrl } = req.body;
    if (!discipline || !displayName) {
      return res.status(400).json({ message: 'discipline and displayName are required' });
    }

    const existing = await PlayerProfile.findOne({ userId: req.user.userId, discipline });
    if (existing) {
      return res.status(409).json({ message: `You already have a ${discipline} profile` });
    }

    const profile = await PlayerProfile.create({
      userId: req.user.userId,
      discipline,
      displayName,
      gamertag,
      country,
      avatarUrl
    });
    res.status(201).json(profile);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getMyProfiles = async (req, res) => {
  try {
    const profiles = await PlayerProfile.find({ userId: req.user.userId });
    res.json(profiles);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getPlayerProfileById = async (req, res) => {
  try {
    const profile = await PlayerProfile.findById(req.params.id);
    if (!profile) return res.status(404).json({ message: 'Player profile not found' });
    res.json(profile);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};