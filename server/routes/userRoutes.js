import { Router } from 'express';
import {
  getProfile,
  updateProfile,
  getUserById,
  getUserReviews,
  getFreelancers,
} from '../controllers/userController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { optionalAuthMiddleware } from '../middleware/optionalAuthMiddleware.js';
import { validateObjectId } from '../utils/validateObjectId.js';

const router = Router();

router.get('/profile', authMiddleware, getProfile);
router.put('/profile', authMiddleware, updateProfile);
router.get('/freelancers', optionalAuthMiddleware, getFreelancers);
router.get('/:id/reviews', validateObjectId(), getUserReviews);
router.get('/:id', validateObjectId(), getUserById);

export default router;
