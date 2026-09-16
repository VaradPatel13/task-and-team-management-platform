import { Router } from 'express';
import { body } from 'express-validator';
import { register, login, logout, getMe } from '../controllers/authController.js';
import validate from '../middleware/validate.js';
import auth from '../middleware/auth.js';

const router = Router();

//  Register 
router.post(
  '/register',
  validate([
    body('name')
      .trim()
      .notEmpty().withMessage('Name is required')
      .isLength({ max: 50 }).withMessage('Name must be 50 characters or less'),
    body('email')
      .trim()
      .notEmpty().withMessage('Email is required')
      .isEmail().withMessage('Please provide a valid email'),
    body('password')
      .notEmpty().withMessage('Password is required')
      .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  ]),
  register
);

//  Login 
router.post(
  '/login',
  validate([
    body('email')
      .trim()
      .notEmpty().withMessage('Email is required')
      .isEmail().withMessage('Please provide a valid email'),
    body('password')
      .notEmpty().withMessage('Password is required'),
  ]),
  login
);

//  Logout 
router.post('/logout', logout);

//  Get Current User 
router.get('/me', auth, getMe);

export default router;
