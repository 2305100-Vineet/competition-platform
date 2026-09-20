const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/auth.middleware');
const {
  registerTeam,
  getRegistrationsForTournament,
  approveRegistration,
  rejectRegistration
} = require('../controllers/registration.controller');

router.post('/', requireAuth, registerTeam);
router.get('/', requireAuth, getRegistrationsForTournament);
router.patch('/:id/approve', requireAuth, approveRegistration);
router.patch('/:id/reject', requireAuth, rejectRegistration);

module.exports = router;