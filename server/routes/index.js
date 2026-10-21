const express = require('express');
const authRoutes = require('./auth.routes');
const opportunityRoutes = require('./opportunity.routes');
const candidateRoutes = require('./candidate.routes');
const applicationRoutes = require('./application.routes');
const chatRoutes = require('./chat.routes');
const feedRoutes = require('./feed.routes');
const matchRoutes = require('./match.routes');
const dashboardRoutes = require('./dashboard.routes');
const notificationRoutes = require('./notification.routes');
const interviewRoutes = require('./interview.routes');
const savedJobRoutes = require('./savedJob.routes');

const router = express.Router();

router.use(authRoutes);
router.use(opportunityRoutes);
router.use(candidateRoutes);
router.use(applicationRoutes);
router.use(chatRoutes);
router.use(feedRoutes);
router.use(matchRoutes);
router.use(dashboardRoutes);
router.use(notificationRoutes);
router.use(interviewRoutes);
router.use(savedJobRoutes);

module.exports = router;
