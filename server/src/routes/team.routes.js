const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/auth.middleware');
const { createTeam, getTeams, getTeamById, addToRoster } = require('../controllers/team.controller');

router.post('/', requireAuth, createTeam);
router.get('/', getTeams);
router.get('/:id', getTeamById);
router.post('/:id/roster', requireAuth, addToRoster);

module.exports = router;