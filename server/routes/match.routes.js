const express = require('express');
const matchController = require('../controllers/match.controller');

const router = express.Router();

router.get('/matches/:userId', matchController.getMatches);

module.exports = router;
