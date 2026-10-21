const express = require('express');
const dashboardController = require('../controllers/dashboard.controller');

const router = express.Router();

router.get('/dashboard/recruiter/:empresaId', dashboardController.getRecruiterDashboard);

module.exports = router;
