import rateLimit from 'express-rate-limit';
import { ENV } from '../config/env.js';

// Safe IP extractor respecting trusted proxy configuration
const getClientIp = (req) => {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded && typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return req.ip || req.socket.remoteAddress || 'unknown-client';
};

// Rate limiter for sensitive authentication endpoints (login, register, password reset, OTP)
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes window
  max: ENV.AUTH_RATE_LIMIT_MAX || 25,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: getClientIp,
  validate: {
    xForwardedForHeader: false,
    forwardedHeader: false,
    keyGeneratorIpFallback: false,
  },
  handler: (req, res, next, options) => {
    const retrySeconds = Math.ceil(options.windowMs / 1000);
    res.setHeader('Retry-After', retrySeconds);
    return res.status(429).json({
      success: false,
      message: 'Too many authentication attempts from this IP address. Please try again after 15 minutes.',
      retryAfter: retrySeconds,
      errors: [],
    });
  },
});

// General API rate limiter
export const apiRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute window
  max: ENV.API_RATE_LIMIT_MAX || 150,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: getClientIp,
  validate: {
    xForwardedForHeader: false,
    forwardedHeader: false,
    keyGeneratorIpFallback: false,
  },
  handler: (req, res, next, options) => {
    res.setHeader('Retry-After', 60);
    return res.status(429).json({
      success: false,
      message: 'API rate limit exceeded. Please throttle your requests.',
      retryAfter: 60,
      errors: [],
    });
  },
});

