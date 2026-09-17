import { Router } from 'express';
import { getUsers } from '../controllers/userController.js';
import auth from '../middleware/auth.js';
import adminOnly from '../middleware/adminOnly.js';

const router = Router();

// Get all users (admin only)
router.get('/', auth, adminOnly, getUsers);

export default router;
