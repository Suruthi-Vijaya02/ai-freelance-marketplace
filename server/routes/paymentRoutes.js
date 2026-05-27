import { Router } from 'express';
import {
  createEscrow,
  releaseMilestone,
  getTransactions,
  getMyEarnings,
} from '../controllers/paymentController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { fraudDetectionMiddleware } from '../middleware/fraudDetectionMiddleware.js';
import { validateObjectId } from '../utils/validateObjectId.js';

const router = Router();

router.get('/my-earnings', authMiddleware, getMyEarnings);
router.get('/', authMiddleware, getTransactions);
router.post('/escrow', authMiddleware, fraudDetectionMiddleware, createEscrow);
router.post('/release/:id', authMiddleware, validateObjectId(), fraudDetectionMiddleware, releaseMilestone);

export default router;
