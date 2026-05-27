import { Router } from 'express';
import { createContract, signContract } from '../controllers/contractController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = Router();

router.post('/', authMiddleware, createContract);
router.patch('/:id/sign', authMiddleware, signContract);

export default router;
