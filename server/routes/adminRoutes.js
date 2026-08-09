// Routes for Admin
import { Router } from 'express';
import {
  getStats,
  getFraudAlerts,
  getUsers,
  banUser,
  getAdminProjects,
  getAdminTransactions,
  getDisputes,
  resolveDispute,
} from '../controllers/adminController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { roleMiddleware } from '../middleware/roleMiddleware.js';

// Admin routes — system statistics, fraud alerts, and user management
const router = Router();

router.use(authMiddleware, roleMiddleware('admin'));

router.get('/stats', getStats);
router.get('/analytics', getStats);
router.get('/fraud-alerts', getFraudAlerts);
router.get('/users', getUsers);
router.patch('/users/:id/ban', banUser);
router.get('/projects', getAdminProjects);
router.get('/transactions', getAdminTransactions);
router.get('/disputes', getDisputes);
router.patch('/disputes/:id/resolve', resolveDispute);

export default router;
