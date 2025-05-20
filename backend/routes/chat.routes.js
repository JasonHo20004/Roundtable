// backend/routes/chat.routes.js
import express from 'express';
import ChatController from "#controllers/chat.controller.js";
import {isAuthenticated} from "#middlewares/auth.mdw.js";

const router = express.Router();

// Apply authentication middleware to all chat routes
router.use(isAuthenticated);

// Define chat routes
router.get('/partners', ChatController.getConversationPartnersPreview);
router.get('/:partnerPrincipalId/messages', ChatController.getMessages);
router.post('/messages', ChatController.sendMessage);
router.post('/:partnerPrincipalId/messages/read', ChatController.markMessagesAsRead);

export default router;