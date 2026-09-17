import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/response.js';
import * as authService from '../services/authService.js';

/**
 * @desc    Authenticate user & get token
 * @route   POST /api/auth/login
 * @access  Public
 */
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const ipAddress = req.ip || req.connection?.remoteAddress || req.headers['x-forwarded-for'];
  const userAgent = req.headers['user-agent'];

  const result = await authService.loginUser({
    email,
    password,
    ipAddress,
    userAgent,
  });

  return ApiResponse.success(res, result, 'Authentication successful');
});

/**
 * @desc    Register a new commercial stakeholder
 * @route   POST /api/auth/register-stakeholder
 * @access  Public
 */
export const registerStakeholder = asyncHandler(async (req, res) => {
  const ipAddress = req.ip || req.connection?.remoteAddress || req.headers['x-forwarded-for'];
  const userAgent = req.headers['user-agent'];

  const result = await authService.registerStakeholderUser({
    ...req.body,
    ipAddress,
    userAgent,
  });

  return ApiResponse.created(res, result, 'Stakeholder registered successfully');
});

/**
 * @desc    Get current authenticated user profile
 * @route   GET /api/auth/me
 * @access  Protected
 */
export const getMe = asyncHandler(async (req, res) => {
  const result = await authService.getCurrentUserProfile(req.user._id);
  return ApiResponse.success(res, result, 'Profile retrieved successfully');
});

/**
 * @desc    Update current authenticated user profile
 * @route   PUT /api/auth/profile
 * @access  Protected
 */
export const updateProfile = asyncHandler(async (req, res) => {
  const result = await authService.updateUserProfile(req.user._id, req.body);
  return ApiResponse.success(res, result, 'Profile updated successfully');
});

/**
 * @desc    Logout current user & record audit event
 * @route   POST /api/auth/logout
 * @access  Protected
 */
export const logout = asyncHandler(async (req, res) => {
  const ipAddress = req.ip || req.connection?.remoteAddress || req.headers['x-forwarded-for'];
  const userAgent = req.headers['user-agent'];

  await authService.logoutUser({
    userId: req.user._id,
    userRole: req.user.role,
    userEmail: req.user.email,
    ipAddress,
    userAgent,
  });

  return ApiResponse.success(res, null, 'Logged out successfully');
});
