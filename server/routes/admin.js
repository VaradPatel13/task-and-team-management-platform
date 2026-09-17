import { Router } from 'express';
import { query } from 'express-validator';
import { adminGetUsers, adminGetTasks, adminGetStats } from '../controllers/adminController.js';
import auth from '../middleware/auth.js';
import adminOnly from '../middleware/adminOnly.js';
import validate from '../middleware/validate.js';

const ALLOWED_SORT_FIELDS = ['createdAt', 'updatedAt', 'dueDate', 'priority', 'status', 'title'];

const router = Router();

router.use(auth);
router.use(adminOnly);

// GET /api/admin/stats — Dashboard stats
router.get('/stats', adminGetStats);

// GET /api/admin/users — List all users
router.get(
  '/users',
  validate([
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
    query('search').optional().isString().withMessage('Search must be a string'),
  ]),
  adminGetUsers
);

// GET /api/admin/tasks — List all tasks
router.get(
  '/tasks',
  validate([
    query('status').optional().isIn(['pending', 'in-progress', 'completed']),
    query('priority').optional().isIn(['low', 'medium', 'high']),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 50 }),
    query('search').optional().isString(),
  ]),
  adminGetTasks
);

export default router;
