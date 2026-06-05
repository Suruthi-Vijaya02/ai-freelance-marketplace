// Routes for Payments
import { Router } from 'express';
import {
  createEscrow,
  releaseMilestone,
  getTransactions,
  getMyEarnings,
  releaseMilestonePayment,
} from '../controllers/paymentController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { fraudDetectionMiddleware } from '../middleware/fraudDetectionMiddleware.js';
import { validateObjectId } from '../utils/validateObjectId.js';

// Payment routes — escrow funding, milestone release, and payment history
const router = Router();

router.get('/my-earnings', authMiddleware, getMyEarnings);
router.get('/', authMiddleware, getTransactions);
router.post('/escrow', authMiddleware, fraudDetectionMiddleware, createEscrow);
router.post('/fund-milestone', authMiddleware, fraudDetectionMiddleware, createEscrow);
router.post('/release/:id', authMiddleware, validateObjectId(), fraudDetectionMiddleware, releaseMilestone);
router.patch('/release/:paymentIntentId', authMiddleware, releaseMilestonePayment);

export default router;
