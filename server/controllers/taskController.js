import Task from '../models/Task.js';
import User from '../models/User.js';
import catchAsync from '../utils/catchAsync.js';

const escapeRegExp = (string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

const ALLOWED_SORT_FIELDS = ['createdAt', 'updatedAt', 'dueDate', 'priority', 'status', 'title'];

const VALID_STATUSES = ['pending', 'in-progress', 'completed'];
const VALID_PRIORITIES = ['low', 'medium', 'high'];

// List tasks with filtering, search, sorting, and pagination.
// Admin sees all tasks. Regular users see only tasks they created or are assigned to.
export const getTasks = catchAsync(async (req, res) => {
  const {
    search,
    status,
    priority,
    sort = '-createdAt',
    page = 1,
    limit = 10,
  } = req.query;

  // Build filter object
  const filter = {};

  if (search) {
    filter.title = { $regex: escapeRegExp(search), $options: 'i' };
  }

  if (status && VALID_STATUSES.includes(status)) {
    filter.status = status;
  }

  if (priority && VALID_PRIORITIES.includes(priority)) {
    filter.priority = priority;
  }

  // Authorization: non-admin users see only their own tasks
  if (req.user.role !== 'admin') {
    filter.$or = [
      { createdBy: req.user._id },
      { assignedTo: req.user._id },
    ];
  }

  // Pagination
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 10));
  const skip = (pageNum - 1) * limitNum;

  // Sort — whitelist allowed fields
  // sort=field → ascending, sort=+field → ascending, sort=-field → descending
  let sortOption = '-createdAt';
  const sortField = sort.replace(/^[+-]/, '');
  if (ALLOWED_SORT_FIELDS.includes(sortField)) {
    sortOption = sort.startsWith('-') ? `-${sortField}` : sortField;
  }

  // Execute query
  const [tasks, total] = await Promise.all([
    Task.find(filter)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .sort(sortOption)
      .skip(skip)
      .limit(limitNum)
      .lean(),
    Task.countDocuments(filter),
  ]);

  const pages = Math.ceil(total / limitNum);

  return res.status(200).json({
    success: true,
    data: { tasks, page: pageNum, pages, total },
  });
});

// Get a single task by ID.
// Access denied if user is not involved (creator, assignee) and not admin.
export const getTask = catchAsync(async (req, res) => {
  const task = await Task.findById(req.params.id)
    .populate('assignedTo', 'name email')
    .populate('createdBy', 'name email');

  if (!task) {
    return res.status(404).json({
      success: false,
      error: 'Task not found',
    });
  }

  // Authorization: check involvement
  if (req.user.role !== 'admin') {
    const userId = req.user._id.toString();
    const creatorId = task.createdBy?._id?.toString();
    const assigneeId = task.assignedTo?._id?.toString();
    if (creatorId !== userId && assigneeId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to view this task',
      });
    }
  }

  return res.status(200).json({
    success: true,
    data: { task },
  });
});

// Create a new task.
export const createTask = catchAsync(async (req, res) => {
  const { title, description, priority, dueDate, status, assignedTo } = req.body;

  // Verify assigned user exists
  const assignedUser = await User.findById(assignedTo);
  if (!assignedUser) {
    return res.status(400).json({
      success: false,
      error: 'Assigned user not found',
    });
  }

  const task = await Task.create({
    title,
    description,
    priority,
    dueDate,
    status,
    assignedTo,
    createdBy: req.user._id,
  });

  const populatedTask = await task.populate([
    { path: 'assignedTo', select: 'name email' },
    { path: 'createdBy', select: 'name email' },
  ]);

  return res.status(201).json({
    success: true,
    data: { task: populatedTask },
  });
});

// Update an existing task.
// Creator/admin may update all fields. Assignee may update status only.
export const updateTask = catchAsync(async (req, res) => {
  const task = await Task.findById(req.params.id);

  if (!task) {
    return res.status(404).json({
      success: false,
      error: 'Task not found',
    });
  }

  // Authorization check
  const isCreator = task.createdBy.toString() === req.user._id.toString();
  const isAssignee = task.assignedTo.toString() === req.user._id.toString();
  const isAdmin = req.user.role === 'admin';

  if (!isCreator && !isAdmin && !isAssignee) {
    return res.status(403).json({
      success: false,
      error: 'Not authorized to update this task',
    });
  }

  // If only assignee (not creator/admin), restrict to status field
  if (isAssignee && !isCreator && !isAdmin) {
    const nonStatusFields = Object.keys(req.body).filter((f) => f !== 'status');
    if (nonStatusFields.length > 0) {
      return res.status(403).json({
        success: false,
        error: 'Assignees can only update task status',
      });
    }
  }

  // Only allow known fields through
  const allowedFields = ['title', 'description', 'priority', 'dueDate', 'status', 'assignedTo'];
  const updates = {};

  for (const field of allowedFields) {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  }

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({
      success: false,
      error: 'No fields to update',
    });
  }

  // If reassigning, verify new assignee exists
  if (updates.assignedTo) {
    const assignedUser = await User.findById(updates.assignedTo);
    if (!assignedUser) {
      return res.status(400).json({
        success: false,
        error: 'Assigned user not found',
      });
    }
  }

  // Apply updates
  Object.assign(task, updates);
  await task.save();

  const populatedTask = await task.populate([
    { path: 'assignedTo', select: 'name email' },
    { path: 'createdBy', select: 'name email' },
  ]);

  return res.status(200).json({
    success: true,
    data: { task: populatedTask },
  });
});

// Delete a task. Only the creator or an admin may delete.
export const deleteTask = catchAsync(async (req, res) => {
  const task = await Task.findById(req.params.id);

  if (!task) {
    return res.status(404).json({
      success: false,
      error: 'Task not found',
    });
  }

  // Authorization check
  const isCreator = task.createdBy.toString() === req.user._id.toString();
  const isAdmin = req.user.role === 'admin';

  if (!isCreator && !isAdmin) {
    return res.status(403).json({
      success: false,
      error: 'Not authorized to delete this task',
    });
  }

  await task.deleteOne();

  return res.status(200).json({
    success: true,
    data: null,
  });
});
