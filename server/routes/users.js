import { Router } from 'express';
import { getUsers } from '../controllers/userController.js';
import auth from '../middleware/auth.js';

const router = Router();

//  Get all users
router.get('/', auth, getUsers);

export default router;
