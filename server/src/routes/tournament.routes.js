const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/auth.middleware');
const {
  createTournament,
  getTournaments,
  getTournamentById,
  openRegistration
} = require('../controllers/tournament.controller');

router.post('/', requireAuth, createTournament);
router.get('/', getTournaments);
router.get('/:id', getTournamentById);
router.patch('/:id/open-registration', requireAuth, openRegistration);

module.exports = router;