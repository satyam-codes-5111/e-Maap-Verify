import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ENV } from '../config/env.js';

/**
 * Protect middleware: validates JWT and injects authenticated user into req.user
 */
export const protect = asyncHandler(async (req, res, next) => {
  if (req.method === 'OPTIONS') {
    return next();
  }

  let token = null;

  // Extract from Authorization header (Bearer <token>)
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  } else if (req.query && req.query.token) {
    token = req.query.token;
  }

  if (!token) {
    throw ApiError.unauthorized('Authentication required. Please provide a valid Bearer token.');
  }

  try {
    // Verify token signature and expiry
    const decoded = jwt.verify(token, ENV.JWT_SECRET);
    const userId = decoded.id || decoded.userId;

    // Fetch user from DB, ensure user still exists and is active
    const user = await User.findById(userId).select('+isActive');

    if (!user) {
      throw ApiError.unauthorized('User associated with this token no longer exists.');
    }

    if (!user.isActive) {
      throw ApiError.unauthorized('This user account has been deactivated. Please contact DoCA Administrator.');
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      throw ApiError.unauthorized('Invalid authentication token.');
    }
    if (error.name === 'TokenExpiredError') {
      throw ApiError.unauthorized('Authentication token has expired. Please log in again.');
    }
    throw error;
  }
});
