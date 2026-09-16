import User from '../models/User.js';
import generateToken from '../utils/generateToken.js';
import catchAsync from '../utils/catchAsync.js';


// Create a new user account.

export const register = catchAsync(async (req, res) => {
  const { name, email, password } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).json({
      success: false,
      error: 'User already exists',
    });
  }

  // Create user 
  const user = await User.create({ name, email, password });

  // Generate token 
  const token = generateToken(user._id, false);

  return res.status(201).json({
    success: true,
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
      token,
    },
  });
});

// Authenticate user and return JWT.
export const login = catchAsync(async (req, res) => {
  const { email, password, rememberMe } = req.body;

  // Find user and explicitly select the password field
  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    return res.status(401).json({
      success: false,
      error: 'Invalid email or password',
    });
  }

  // Compare passwords
  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    return res.status(401).json({
      success: false,
      error: 'Invalid email or password',
    });
  }

  // Generate token 
  const token = generateToken(user._id, rememberMe);

  return res.status(200).json({
    success: true,
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
      token,
    },
  });
});


// Client-side logout 
export const logout = catchAsync(async (_req, res) => {
  return res.status(200).json({
    success: true,
    data: null,
  });
});

// Return the currently authenticated user's profile.
export const getMe = catchAsync(async (req, res) => {
  return res.status(200).json({
    success: true,
    data: {
      user: req.user,
    },
  });
});
