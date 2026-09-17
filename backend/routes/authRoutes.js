import { Router } from 'express';
import * as authController from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';
import { validate, loginSchema, registerStakeholderSchema } from '../validators/authValidator.js';
import { authRateLimiter } from '../middleware/rateLimitMiddleware.js';
import { ApiError } from '../utils/ApiError.js';

const router = Router();

// Public Authentication Endpoints protected by authRateLimiter
router.route('/login')
  .post(authRateLimiter, validate(loginSchema), authController.login)
  .all((req, res, next) => next(ApiError.methodNotAllowed(`HTTP method ${req.method} is not allowed on /api/auth/login. Supported methods: POST.`)));

router.route('/register-stakeholder')
  .post(authRateLimiter, validate(registerStakeholderSchema), authController.registerStakeholder)
  .all((req, res, next) => next(ApiError.methodNotAllowed(`HTTP method ${req.method} is not allowed on /api/auth/register-stakeholder. Supported methods: POST.`)));

// Rate-limited sensitive endpoints for password/reset & OTP
router.route('/forgot-password')
  .post(authRateLimiter, (req, res, next) => {
    return res.status(200).json({
      success: true,
      message: 'If the provided email address exists in our verified records, a secure password reset link has been dispatched.',
    });
  })
  .all((req, res, next) => next(ApiError.methodNotAllowed(`HTTP method ${req.method} is not allowed on /api/auth/forgot-password. Supported methods: POST.`)));

router.route('/reset-password')
  .post(authRateLimiter, (req, res, next) => {
    return next(ApiError.badRequest('Password reset token and new password are required.'));
  })
  .all((req, res, next) => next(ApiError.methodNotAllowed(`HTTP method ${req.method} is not allowed on /api/auth/reset-password. Supported methods: POST.`)));

router.route('/verify-otp')
  .post(authRateLimiter, (req, res, next) => {
    return next(ApiError.badRequest('OTP verification code and identifier are required.'));
  })
  .all((req, res, next) => next(ApiError.methodNotAllowed(`HTTP method ${req.method} is not allowed on /api/auth/verify-otp. Supported methods: POST.`)));

// Authenticated Session Endpoints (JWT Protected)
router.get('/me', protect, authController.getMe);
router.get('/profile', protect, authController.getMe);
router.put('/profile', protect, authController.updateProfile);
router.post('/logout', protect, authController.logout);

export default router;

