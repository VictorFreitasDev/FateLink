const express = require('express');
const opportunityController = require('../controllers/opportunity.controller');

const router = express.Router();

router.get('/opportunities', opportunityController.getAll);
router.post('/opportunities', opportunityController.create);
router.put('/opportunities/:id', opportunityController.update);
router.patch('/opportunities/:id/status', opportunityController.updateStatus);
router.delete('/opportunities/:id', opportunityController.delete);
router.post('/opportunities/:id/view', opportunityController.recordView);
router.get('/opportunities/:id/candidates', opportunityController.getApplicants);

module.exports = router;
