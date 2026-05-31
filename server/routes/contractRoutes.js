import { Router } from 'express';
import { createContract, signContract, markContractCompleted, updateDispatchStatus, getMyContracts, getContractById } from '../controllers/contractController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/my', authMiddleware, getMyContracts);
router.get('/:id', authMiddleware, getContractById);
router.post('/', authMiddleware, createContract);
router.patch('/:id/sign', authMiddleware, signContract);
router.patch('/:id/complete', authMiddleware, markContractCompleted);
router.patch('/:id/dispatch', authMiddleware, updateDispatchStatus);

export default router;
