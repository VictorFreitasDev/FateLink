const express = require('express');
const notificationController = require('../controllers/notification.controller');

const router = express.Router();

router.get('/notifications/:userId', notificationController.getUserNotifications);
router.patch('/notifications/:id/read', notificationController.markAsRead);
router.patch('/notifications/user/:userId/read-all', notificationController.markAllAsRead);

module.exports = router;
