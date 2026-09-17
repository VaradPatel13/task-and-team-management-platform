import User from '../models/User.js';
import Task from '../models/Task.js';
import catchAsync from '../utils/catchAsync.js';

// Admin: Get all users with pagination
export const adminGetUsers = catchAsync(async (req, res) => {
  const { page = 1, limit = 20, search } = req.query;

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (pageNum - 1) * limitNum;

  const filter = {};
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }

  const [users, total] = await Promise.all([
    User.find(filter)
      .select('name email role createdAt')
      .sort('-createdAt')
      .skip(skip)
      .limit(limitNum)
      .lean(),
    User.countDocuments(filter),
  ]);

  return res.status(200).json({
    success: true,
    data: {
      users: users.map((u) => ({
        id: u._id,
        name: u.name,
        email: u.email,
        role: u.role,
        createdAt: u.createdAt,
      })),
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      total,
    },
  });
});

// Admin: Get all tasks with pagination
export const adminGetTasks = catchAsync(async (req, res) => {
  const { page = 1, limit = 20, status, priority, search } = req.query;

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (pageNum - 1) * limitNum;

  const filter = {};
  if (search) filter.title = { $regex: search, $options: 'i' };
  if (status) filter.status = status;
  if (priority) filter.priority = priority;

  const [tasks, total] = await Promise.all([
    Task.find(filter)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .sort('-createdAt')
      .skip(skip)
      .limit(limitNum)
      .lean(),
    Task.countDocuments(filter),
  ]);

  return res.status(200).json({
    success: true,
    data: {
      tasks,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      total,
    },
  });
});

// Admin: Get dashboard stats
export const adminGetStats = catchAsync(async (_req, res) => {
  const [totalUsers, totalTasks, tasksByStatus, tasksByPriority, recentTasks] = await Promise.all([
    User.countDocuments(),
    Task.countDocuments(),
    Task.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    Task.aggregate([
      { $group: { _id: '$priority', count: { $sum: 1 } } },
    ]),
    Task.find()
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .sort('-createdAt')
      .limit(5)
      .lean(),
  ]);

  const statusMap = { pending: 0, 'in-progress': 0, completed: 0 };
  tasksByStatus.forEach((s) => { statusMap[s._id] = s.count; });

  const priorityMap = { low: 0, medium: 0, high: 0 };
  tasksByPriority.forEach((p) => { priorityMap[p._id] = p.count; });

  return res.status(200).json({
    success: true,
    data: {
      totalUsers,
      totalTasks,
      tasksByStatus: statusMap,
      tasksByPriority: priorityMap,
      recentTasks,
    },
  });
});
