import { Router } from 'express';
import {
  getConversations,
  getMessages,
  sendMessage,
  createConversation,
  editMessage,
  addReaction,
} from '../controllers/messageController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/conversations', authMiddleware, getConversations);
router.get('/:conversationId', authMiddleware, getMessages);
router.post('/', authMiddleware, sendMessage);
router.post('/conversation', authMiddleware, createConversation);
router.patch('/:id/edit', authMiddleware, editMessage);
router.post('/:id/reaction', authMiddleware, addReaction);

export default router;