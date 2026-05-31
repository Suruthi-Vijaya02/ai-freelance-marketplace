import { Router } from 'express';
import {
  getProfile,
  updateProfile,
  updateAvailability,
  getUserById,
  getUserReviews,
  getFreelancers,
  uploadResume,
  getAiSuggestions,
  applyAiSuggestions,
} from '../controllers/userController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { optionalAuthMiddleware } from '../middleware/optionalAuthMiddleware.js';
import { validateObjectId } from '../utils/validateObjectId.js';
import { resumeUpload } from '../middleware/uploadMiddleware.js';

const router = Router();

router.get('/profile', authMiddleware, getProfile);
router.put('/profile', authMiddleware, updateProfile);
router.get('/freelancers', optionalAuthMiddleware, getFreelancers);
router.post('/uploadResume', authMiddleware, resumeUpload.single('resume'), uploadResume);
router.get('/ai-suggestions', authMiddleware, getAiSuggestions);
router.post('/ai-suggestions/apply', authMiddleware, applyAiSuggestions);
router.put('/:id/availability', authMiddleware, validateObjectId(), updateAvailability);
router.get('/:id/reviews', validateObjectId(), getUserReviews);
router.get('/:id', validateObjectId(), getUserById);

export default router;

