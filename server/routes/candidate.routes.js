const express = require('express');
const candidateController = require('../controllers/candidate.controller');

const router = express.Router();

router.get('/candidates', candidateController.getAll);
router.post('/candidates', candidateController.create);

// Perfil detalhado do estudante e gerenciamento de currículo em PDF
router.get('/candidates/profile/:userId', candidateController.getProfile);
router.put('/candidates/profile/:userId', candidateController.updateProfile);
router.post('/candidates/profile/:userId/resume', candidateController.uploadResume);
router.delete('/candidates/profile/:userId/resume', candidateController.deleteResume);

module.exports = router;
