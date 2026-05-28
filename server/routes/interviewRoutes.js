import { Router } from 'express';
import {
  scheduleInterview,
  getMyInterviews,
  getInterviewById,
  updateInterviewStatus,
} from '../controllers/interviewController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { validateObjectId } from '../utils/validateObjectId.js';

const router = Router();

router.use(authMiddleware);

router.post('/schedule', scheduleInterview);
router.get('/my-interviews', getMyInterviews);
router.get('/:id', validateObjectId(), getInterviewById);
router.patch('/:id/status', validateObjectId(), updateInterviewStatus);

export default router;
