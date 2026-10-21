const express = require('express');
const applicationController = require('../controllers/application.controller');

const router = express.Router();

router.post('/applications', applicationController.apply);
router.get('/applications/student/:alunoId', applicationController.getStudentApplications);
router.get('/applications/company/:empresaId', applicationController.getCompanyApplications);
router.get('/applications/:id/history', applicationController.getHistory);
router.patch('/applications/:id/status', applicationController.updateStatus);

module.exports = router;
