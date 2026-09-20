const Team = require('../models/Team');
const PlayerProfile = require('../models/PlayerProfile');

exports.createTeam = async (req, res) => {
  try {
    const { name, discipline, logoUrl } = req.body;
    if (!name || !discipline) {
      return res.status(400).json({ message: 'name and discipline are required' });
    }
    const team = await Team.create({
      name,
      discipline,
      captainUserId: req.user.userId,
      logoUrl
    });
    res.status(201).json(team);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getTeams = async (req, res) => {
  try {
    const filter = {};
    if (req.query.discipline) filter.discipline = req.query.discipline;
    const teams = await Team.find(filter);
    res.json(teams);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getTeamById = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);
    if (!team) return res.status(404).json({ message: 'Team not found' });
    res.json(team);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.addToRoster = async (req, res) => {
  try {
    const { playerId, role } = req.body;
    if (!playerId) {
      return res.status(400).json({ message: 'playerId is required' });
    }

    const team = await Team.findById(req.params.id);
    if (!team) return res.status(404).json({ message: 'Team not found' });

    if (team.captainUserId.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Only the team captain can manage the roster' });
    }

    const player = await PlayerProfile.findById(playerId);
    if (!player) return res.status(404).json({ message: 'Player profile not found' });

    if (player.discipline !== team.discipline) {
      return res.status(400).json({ message: `Player profile is for ${player.discipline}, team is ${team.discipline}` });
    }

    const alreadyOnRoster = team.roster.some(
      (member) => member.playerId.toString() === playerId && !member.leftAt
    );
    if (alreadyOnRoster) {
      return res.status(409).json({ message: 'Player is already on this team roster' });
    }

    team.roster.push({ playerId, role });
    await team.save();

    res.status(201).json(team);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};