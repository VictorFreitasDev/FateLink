const express = require('express');
const interviewController = require('../controllers/interview.controller');

const router = express.Router();

router.post('/interviews', interviewController.propose);
router.patch('/interviews/:id/confirm', interviewController.confirm);
router.get('/interviews/student/:alunoId', interviewController.getStudentInterviews);
router.get('/interviews/company/:empresaId', interviewController.getCompanyInterviews);
router.get('/interviews/application/:candidaturaId', interviewController.getByCandidatura);

module.exports = router;

