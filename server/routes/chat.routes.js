const express = require('express');
const chatController = require('../controllers/chat.controller');

const router = express.Router();

router.get('/conversations/user/:userId', chatController.getUserConversations);
router.post('/conversations', chatController.startConversation);
router.get('/conversations/:id/messages', chatController.getMessages);
router.post('/conversations/:id/messages', chatController.sendMessage);

module.exports = router;
