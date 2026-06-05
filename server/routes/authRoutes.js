// Routes for Authentication
import { Router } from 'express';
import { register, login } from '../controllers/authController.js';

// Auth routes — user registration and login
const router = Router();
router.post('/register', register);
router.post('/login', login);

export default router;
