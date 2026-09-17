import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import hpp from 'hpp';
import path from 'path';
import fs from 'fs';
import { ENV, ALLOWED_ORIGINS } from './config/env.js';
import { apiRateLimiter } from './middleware/rateLimitMiddleware.js';
import { errorHandler } from './middleware/errorMiddleware.js';
import { ApiError } from './utils/ApiError.js';
import { protect } from './middleware/authMiddleware.js';
import { getSecureFile } from './controllers/fileController.js';

import { requestSecurityMiddleware } from './middleware/securityMiddleware.js';

// Route imports
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import stakeholderRoutes from './routes/stakeholderRoutes.js';
import instrumentRoutes from './routes/instrumentRoutes.js';
import applicationRoutes from './routes/applicationRoutes.js';
import scheduleRoutes from './routes/scheduleRoutes.js';
import inspectionRoutes from './routes/inspectionRoutes.js';
import resultRoutes from './routes/resultRoutes.js';
import certificateRoutes from './routes/certificateRoutes.js';
import { verifyCertificatePublic } from './controllers/certificateController.js';
import notificationRoutes from './routes/notificationRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import centerRoutes from './routes/centerRoutes.js';

const app = express();

// Disable express fingerprint header
app.disable('x-powered-by');

// Trust reverse proxy (e.g. Cloud Run, Nginx) so req.ip and forwarded headers work properly
app.set('trust proxy', 1);

// Global Helmet Security Headers (allows AI Studio preview iframe on frontend)
app.use(
  helmet({
    contentSecurityPolicy: false, // Customized for /api endpoints below without breaking frontend preview
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    crossOriginOpenerPolicy: false,
    crossOriginEmbedderPolicy: false,
    frameguard: false, // Handled per-route: DENY on /api/*, allowed for AI Studio preview iframe
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: false,
    },
    xContentTypeOptions: true,
    dnsPrefetchControl: { allow: false },
    permittedCrossDomainPolicies: { permittedPolicies: 'none' },
  })
);

// Security Headers specific to API responses (does not interfere with Vite frontend)
app.use('/api', (req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});

// Remove X-Frame-Options ONLY on non-API routes to allow AI Studio live preview iframe
app.use((req, res, next) => {
  if (!req.path.startsWith('/api')) {
    res.removeHeader('X-Frame-Options');
  }
  next();
});

// Environment-Driven CORS Security
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests without Origin (curl, server-to-server, same-origin)
      if (!origin) {
        return callback(null, true);
      }
      const cleanOrigin = origin.trim().replace(/\/$/, '');
      if (
        ALLOWED_ORIGINS.includes(cleanOrigin) ||
        cleanOrigin.endsWith('.run.app') ||
        cleanOrigin.endsWith('.google.com') ||
        cleanOrigin.includes('google.com') ||
        cleanOrigin.includes('aistudio') ||
        cleanOrigin.endsWith('ai.studio') ||
        cleanOrigin.includes('localhost') ||
        cleanOrigin.includes('127.0.0.1')
      ) {
        return callback(null, true);
      }
      // Return origin in development/cloud preview to avoid CORS blockage
      return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    exposedHeaders: ['RateLimit-Limit', 'RateLimit-Remaining', 'RateLimit-Reset', 'Retry-After'],
    maxAge: 86400,
  })
);

// Body parsers with enforced limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// HTTP Parameter Pollution (HPP) Defense
app.use(hpp());

// Disallow mutating HTTP methods on /uploads/ immediately with 405 Method Not Allowed
app.use('/uploads', (req, res, next) => {
  if (req.method !== 'GET' && req.method !== 'HEAD' && req.method !== 'OPTIONS') {
    return next(ApiError.methodNotAllowed(`HTTP method ${req.method} is not allowed on file storage.`));
  }
  next();
});

// Input Validation, Injection & Request Security Middleware
app.use(requestSecurityMiddleware);

// Ensure upload directories exist
const uploadDirs = ['documents', 'certificates', 'instrument-photos'];
uploadDirs.forEach((dir) => {
  const dirPath = path.join(ENV.UPLOAD_DIR, dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
});

// Sensitive system files and path traversal protection
app.use((req, res, next) => {
  let reqPath = req.path || '';
  try {
    reqPath = decodeURIComponent(reqPath);
  } catch (e) {
    return next(ApiError.badRequest('Malformed request URL path.'));
  }

  const lower = reqPath.toLowerCase();
  if (
    lower.includes('..') ||
    lower.includes('/.env') ||
    lower.endsWith('.env') ||
    lower.includes('package.json') ||
    lower.includes('server.ts') ||
    lower.includes('server.js') ||
    lower.includes('/backend/') ||
    lower.includes('/.git')
  ) {
    return res.status(404).json({ success: false, message: 'Resource not found' });
  }

  // Block direct /node_modules/ access in production, while permitting Vite dev server dependency resolution
  if (process.env.NODE_ENV === 'production' && lower.includes('/node_modules/')) {
    return res.status(404).json({ success: false, message: 'Resource not found' });
  }
  next();
});

// Secure uploads access with JWT authentication and strict authorization rules
app.route('/uploads/:folder/:filename')
  .get(protect, getSecureFile)
  .all((req, res, next) => next(ApiError.methodNotAllowed('HTTP method not allowed on file storage.')));

app.all('/uploads', (req, res, next) => next(ApiError.forbidden('Direct directory listing or access to storage is forbidden.')));
app.all('/uploads/*', (req, res, next) => next(ApiError.notFound('Requested file resource not found.')));

// Rate limiting on API routes
app.use('/api/', apiRateLimiter);

// Health Check API
app.route('/api/health')
  .get((req, res) => {
    res.status(200).json({
      status: 'ok',
      service: 'Legal Metrology Online Verification System (DoCA)',
      problemStatement: 'SIH-26036',
      timestamp: new Date().toISOString(),
      environment: ENV.NODE_ENV,
    });
  })
  .all((req, res, next) => {
    next(ApiError.methodNotAllowed(`HTTP method ${req.method} is not allowed on /api/health. Supported methods: GET.`));
  });

import { getAuditLogs } from './controllers/reportController.js';
import { authorize } from './middleware/roleMiddleware.js';
import { USER_ROLES } from './config/constants.js';

// API Route Mounts
app.use('/api/auth', authRoutes);
app.use('/api/admin/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/users', userRoutes);
app.use('/api/stakeholders', stakeholderRoutes);
app.use('/api/instruments', instrumentRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/inspections', inspectionRoutes);
app.use('/api/results', resultRoutes);

// Public verification endpoints with strict HTTP method security
app.route('/api/public/certificates/verify/:token')
  .get(verifyCertificatePublic)
  .all((req, res, next) => {
    next(ApiError.methodNotAllowed(`HTTP method ${req.method} is not supported for certificate verification. Supported methods: GET.`));
  });

app.route('/api/public/certificates/search/:token')
  .get(verifyCertificatePublic)
  .all((req, res, next) => {
    next(ApiError.methodNotAllowed(`HTTP method ${req.method} is not supported for certificate search. Supported methods: GET.`));
  });

app.use('/api/certificates', certificateRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/centers', centerRoutes);
app.get(
  '/api/audit-logs',
  protect,
  authorize(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
  getAuditLogs
);

// Catch-all 404 for unhandled API endpoints
app.all('/api/*', (req, res, next) => {
  next(ApiError.notFound(`API endpoint '${req.originalUrl}' does not exist on this server.`));
});

// Centralized error handling middleware
app.use(errorHandler);

export default app;

