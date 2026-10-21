const express = require('express');
const feedController = require('../controllers/feed.controller');

const router = express.Router();

router.post('/feed/decision', feedController.recordDecision);
router.get('/feed/decisions/:userId', feedController.getUserDecisions);
router.post('/feed/undo', feedController.undoDecision);
router.post('/feed/reset', feedController.resetFeed);

module.exports = router;
