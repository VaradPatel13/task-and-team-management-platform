import User from '../models/User.js';
import catchAsync from '../utils/catchAsync.js';

// Get all users (for user picker)
export const getUsers = catchAsync(async (_req, res) => {
  const users = await User.find().select('name email role createdAt');

  return res.status(200).json({
    success: true,
    data: {
      users: users.map((user) => ({
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      })),
    },
  });
});
