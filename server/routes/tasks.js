import { Router } from 'express';
import { body, param, query } from 'express-validator';
import {
  getTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
} from '../controllers/taskController.js';
import validate from '../middleware/validate.js';
import auth from '../middleware/auth.js';

const ALLOWED_SORT_FIELDS = ['createdAt', 'updatedAt', 'dueDate', 'priority', 'status', 'title'];

const router = Router();

router.use(auth);

// GET /api/tasks — List tasks with query parameter validation
router.get(
  '/',
  validate([
    query('status')
      .optional()
      .isIn(['pending', 'in-progress', 'completed'])
      .withMessage('Status must be pending, in-progress, or completed'),
    query('priority')
      .optional()
      .isIn(['low', 'medium', 'high'])
      .withMessage('Priority must be low, medium, or high'),
    query('sort')
      .optional()
      .custom((value) => {
        const field = value.replace(/^[+-]/, '');
        if (!ALLOWED_SORT_FIELDS.includes(field)) {
          throw new Error(`Sort field must be one of: ${ALLOWED_SORT_FIELDS.join(', ')}`);
        }
        return true;
      }),
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage('Limit must be between 1 and 50'),
  ]),
  getTasks
);

// GET /api/tasks/:id — Get single task
router.get(
  '/:id',
  validate([param('id').isMongoId().withMessage('Invalid task ID')]),
  getTask
);

// POST /api/tasks — Create task
router.post(
  '/',
  validate([
    body('title')
      .trim()
      .notEmpty().withMessage('Title is required')
      .isLength({ max: 200 }).withMessage('Title cannot exceed 200 characters'),
    body('description')
      .optional()
      .isString()
      .isLength({ max: 2000 }).withMessage('Description cannot exceed 2000 characters'),
    body('priority')
      .optional()
      .isIn(['low', 'medium', 'high']).withMessage('Priority must be low, medium, or high'),
    body('dueDate')
      .notEmpty().withMessage('Due date is required')
      .isISO8601().withMessage('Due date must be a valid date'),
    body('status')
      .optional()
      .isIn(['pending', 'in-progress', 'completed']).withMessage('Status must be pending, in-progress, or completed'),
    body('assignedTo')
      .notEmpty().withMessage('Assigned user is required')
      .isMongoId().withMessage('Invalid user ID for assignedTo'),
  ]),
  createTask
);

// PUT /api/tasks/:id — Update task
router.put(
  '/:id',
  validate([
    param('id').isMongoId().withMessage('Invalid task ID'),
    body('title')
      .optional()
      .trim()
      .isLength({ min: 1 }).withMessage('Title cannot be empty')
      .isLength({ max: 200 }).withMessage('Title cannot exceed 200 characters'),
    body('description')
      .optional()
      .isString()
      .isLength({ max: 2000 }).withMessage('Description cannot exceed 2000 characters'),
    body('priority')
      .optional()
      .isIn(['low', 'medium', 'high']).withMessage('Priority must be low, medium, or high'),
    body('dueDate')
      .optional()
      .isISO8601().withMessage('Due date must be a valid date'),
    body('status')
      .optional()
      .isIn(['pending', 'in-progress', 'completed']).withMessage('Status must be pending, in-progress, or completed'),
    body('assignedTo')
      .optional()
      .isMongoId().withMessage('Invalid user ID for assignedTo'),
  ]),
  updateTask
);

// DELETE /api/tasks/:id — Delete task
router.delete(
  '/:id',
  validate([param('id').isMongoId().withMessage('Invalid task ID')]),
  deleteTask
);

export default router;
