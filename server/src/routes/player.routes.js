const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/auth.middleware');
const { createPlayerProfile, getMyProfiles, getPlayerProfileById } = require('../controllers/player.controller');

router.post('/', requireAuth, createPlayerProfile);
router.get('/me', requireAuth, getMyProfiles);
router.get('/:id', getPlayerProfileById);

module.exports = router;