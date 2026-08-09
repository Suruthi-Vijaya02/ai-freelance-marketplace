// Routes for Projects
import { Router } from 'express';
import {
  createProject,
  getProjects,
  getMyProjects,
  getHiredProjects,
  getProjectById,
  getProjectMatches,
  updateProjectLifecycle,
  updateProjectTotalSpent,
  updateProject,
  deleteProject,
} from '../controllers/projectController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { optionalAuthMiddleware } from '../middleware/optionalAuthMiddleware.js';
import { roleMiddleware } from '../middleware/roleMiddleware.js';
import { fraudDetectionMiddleware } from '../middleware/fraudDetectionMiddleware.js';
import { validateObjectId } from '../utils/validateObjectId.js';

// Project routes — job posting, browsing, and matching
const router = Router();

router.get('/', optionalAuthMiddleware, getProjects);
router.get('/my', authMiddleware, roleMiddleware('client', 'admin'), getMyProjects);
router.get('/hired', authMiddleware, roleMiddleware('freelancer'), getHiredProjects);
router.get('/:id', validateObjectId(), getProjectById);
router.get('/:id/matches', validateObjectId(), getProjectMatches);
router.post('/', authMiddleware, roleMiddleware('client', 'admin'), fraudDetectionMiddleware, createProject);
router.put('/:id', authMiddleware, validateObjectId(), updateProject);
router.patch('/:id', authMiddleware, validateObjectId(), updateProject);
router.delete('/:id', authMiddleware, validateObjectId(), deleteProject);
router.patch('/:id/lifecycle', authMiddleware, validateObjectId(), updateProjectLifecycle);
router.patch('/:id/total-spent', authMiddleware, validateObjectId(), updateProjectTotalSpent);

export default router;
