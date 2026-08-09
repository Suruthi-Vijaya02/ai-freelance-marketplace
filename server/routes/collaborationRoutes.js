import { Router } from 'express';
import { getSession, saveSession } from '../controllers/collaborationController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authMiddleware);

router.get('/:roomId', getSession);
router.post('/:roomId/save', saveSession);

export default router;
