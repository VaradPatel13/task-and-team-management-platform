import { Router } from 'express';
import { getUsers } from '../controllers/userController.js';
import auth from '../middleware/auth.js';
import adminOnly from '../middleware/adminOnly.js';

const router = Router();

// Get all users (all authenticated users — needed for task assignment)
router.get('/', auth, getUsers);

export default router;
