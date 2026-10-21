const express = require('express');
const savedJobController = require('../controllers/savedJob.controller');

const router = express.Router();

router.get('/saved-jobs/:userId', savedJobController.getSavedJobs);
router.post('/saved-jobs', savedJobController.toggleSaveJob);

module.exports = router;
