import { Router } from 'express';
import { submitProposal, getProposalsByProject } from '../controllers/proposalController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { roleMiddleware } from '../middleware/roleMiddleware.js';
import { fraudDetectionMiddleware } from '../middleware/fraudDetectionMiddleware.js';
import { validateObjectId } from '../utils/validateObjectId.js';

const router = Router();

router.get('/project/:id', validateObjectId(), getProposalsByProject);
router.post('/', authMiddleware, roleMiddleware('freelancer'), fraudDetectionMiddleware, submitProposal);

export default router;
