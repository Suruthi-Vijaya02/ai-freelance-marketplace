import { Router } from 'express';
import {
  createProject,
  getProjects,
  getMyProjects,
  getHiredProjects,
  getProjectById,
  getProjectMatches,
} from '../controllers/projectController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { optionalAuthMiddleware } from '../middleware/optionalAuthMiddleware.js';
import { roleMiddleware } from '../middleware/roleMiddleware.js';
import { fraudDetectionMiddleware } from '../middleware/fraudDetectionMiddleware.js';
import { validateObjectId } from '../utils/validateObjectId.js';

const router = Router();

router.get('/', optionalAuthMiddleware, getProjects);
router.get('/my', authMiddleware, roleMiddleware('client', 'admin'), getMyProjects);
router.get('/hired', authMiddleware, roleMiddleware('freelancer'), getHiredProjects);
router.get('/:id', validateObjectId(), getProjectById);
router.get('/:id/matches', validateObjectId(), getProjectMatches);
router.post('/', authMiddleware, roleMiddleware('client', 'admin'), fraudDetectionMiddleware, createProject);

export default router;
