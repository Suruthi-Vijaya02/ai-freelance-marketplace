import { Router } from 'express';
import {
  getConversations,
  getMessages,
  sendMessage,
} from '../controllers/messageController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/conversations', authMiddleware, getConversations);
router.get('/:conversationId', authMiddleware, getMessages);
router.post('/', authMiddleware, sendMessage);

export default router;
