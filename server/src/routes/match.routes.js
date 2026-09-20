const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/auth.middleware');
const {
  createMatch,
  generateRoundRobinFixtures,
  generateSingleEliminationBracket,
  getMatchesForTournament,
  getMatchById,
  submitResult,
  correctResult
} = require('../controllers/match.controller');

router.post('/', requireAuth, createMatch);
router.post('/generate/round-robin', requireAuth, generateRoundRobinFixtures);
router.post('/generate/single-elimination', requireAuth, generateSingleEliminationBracket);
router.get('/', getMatchesForTournament);
router.get('/:id', getMatchById);
router.post('/:id/result', requireAuth, submitResult);
router.patch('/:id/result', requireAuth, correctResult);

module.exports = router;