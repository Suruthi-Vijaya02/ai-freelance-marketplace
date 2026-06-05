// Routes for Proposals
import { Router } from 'express';
import {
  submitProposal,
  getProposals,
  getProposalsByProject,
  getMyProposals,
  updateProposal,
  updateProposalStatus,
} from '../controllers/proposalController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { roleMiddleware } from '../middleware/roleMiddleware.js';
import { fraudDetectionMiddleware } from '../middleware/fraudDetectionMiddleware.js';
import { validateObjectId } from '../utils/validateObjectId.js';

// Proposal routes — submitting and managing project bids
const router = Router();

router.get('/my', authMiddleware, roleMiddleware('freelancer'), getMyProposals);
router.get('/', authMiddleware, getProposals);
router.get('/project/:id', authMiddleware, validateObjectId(), getProposalsByProject);
router.post('/create', authMiddleware, roleMiddleware('freelancer'), fraudDetectionMiddleware, submitProposal);
router.post('/', authMiddleware, roleMiddleware('freelancer'), fraudDetectionMiddleware, submitProposal);
router.patch('/:id', authMiddleware, roleMiddleware('freelancer'), validateObjectId(), updateProposal);
router.patch('/:id/status', authMiddleware, roleMiddleware('client', 'admin'), validateObjectId(), updateProposalStatus);

export default router;
