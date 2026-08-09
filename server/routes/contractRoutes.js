// Routes for Contracts
import { Router } from 'express';
import {
  createContract,
  signContract,
  markContractCompleted,
  updateDispatchStatus,
  getMyContracts,
  getContractById,
  submitMilestone,
  approveMilestone,
  releaseMilestone,
  openDispute
} from '../controllers/contractController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

// Contract routes — creation, signing, and milestone management
const router = Router();

// Retrieve contracts
router.get('/', authMiddleware, getMyContracts);
router.get('/my', authMiddleware, getMyContracts);
router.get('/:id', authMiddleware, getContractById);

// Create contract
router.post('/', authMiddleware, createContract);

// Sign contract (support both POST and PATCH)
router.patch('/:id/sign', authMiddleware, signContract);
router.post('/:id/sign', authMiddleware, signContract);

// Milestone lifecycle (support both PUT and PATCH/POST where requested)
router.put('/:id/milestones/:milestoneId/submit', authMiddleware, submitMilestone);
router.patch('/:id/milestones/:milestoneId/submit', authMiddleware, submitMilestone);

router.put('/:id/milestones/:milestoneId/approve', authMiddleware, approveMilestone);
router.patch('/:id/milestones/:milestoneId/approve', authMiddleware, approveMilestone);

router.put('/:id/milestones/:milestoneId/release', authMiddleware, releaseMilestone);
router.patch('/:id/milestones/:milestoneId/release', authMiddleware, releaseMilestone);

// Disputes and completion
router.post('/:id/dispute', authMiddleware, openDispute);
router.patch('/:id/complete', authMiddleware, markContractCompleted);
router.patch('/:id/dispatch', authMiddleware, updateDispatchStatus);

export default router;
