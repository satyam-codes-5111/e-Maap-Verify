import dotenv from 'dotenv';
import path from 'path';

// Load environment configuration from .env file
dotenv.config();

// Validate strictly required environment variables with no hard-coded fallback
if (!process.env.JWT_SECRET) {
  throw new Error('[FATAL CONFIG ERROR] Missing required environment variable: JWT_SECRET must be set in environment.');
}

const BACKEND_PORT = parseInt(process.env.PORT, 10) || 3000;

// Resolve SERVER_URL to match backend port
const resolvedServerUrl = (process.env.SERVER_URL && process.env.SERVER_URL.includes(`:${BACKEND_PORT}`))
  ? process.env.SERVER_URL
  : (process.env.SERVER_URL || process.env.APP_URL || `http://localhost:${BACKEND_PORT}`);

export const ENV = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: BACKEND_PORT,
  MONGO_URI: process.env.MONGO_URI || process.env.MONGODB_URI || '',
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '8h',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  SERVER_URL: resolvedServerUrl,
  UPLOAD_DIR: process.env.UPLOAD_DIR ? path.resolve(process.cwd(), process.env.UPLOAD_DIR) : path.resolve(process.cwd(), 'uploads'),
  SMTP_HOST: process.env.SMTP_HOST || '',
  SMTP_PORT: parseInt(process.env.SMTP_PORT || '587', 10),
  SMTP_USER: process.env.SMTP_USER || '',
  SMTP_PASSWORD: process.env.SMTP_PASSWORD || '',
  SMTP_FROM: process.env.SMTP_FROM || '',
  // Initial Admin credentials - read STRICTLY from environment
  ADMIN_INITIAL_NAME: process.env.ADMIN_INITIAL_NAME || process.env.ADMIN_NAME || '',
  ADMIN_INITIAL_EMAIL: process.env.ADMIN_INITIAL_EMAIL || process.env.ADMIN_EMAIL || '',
  ADMIN_INITIAL_PASSWORD: process.env.ADMIN_INITIAL_PASSWORD || process.env.ADMIN_PASSWORD || '',
  ADMIN_INITIAL_PHONE: process.env.ADMIN_INITIAL_PHONE || process.env.ADMIN_PHONE || '',
  // Reminder Windows (days) and statutory due thresholds
  REMINDER_WINDOWS: (process.env.REMINDER_WINDOWS || '7,30,60')
    .split(',')
    .map((w) => parseInt(w.trim(), 10))
    .filter((n) => !isNaN(n) && n > 0)
    .sort((a, b) => a - b),
  OVERDUE_APPLICATION_DAYS: parseInt(process.env.OVERDUE_APPLICATION_DAYS || '15', 10),
  AUTH_RATE_LIMIT_MAX: parseInt(process.env.AUTH_RATE_LIMIT_MAX || '25', 10),
  API_RATE_LIMIT_MAX: parseInt(process.env.API_RATE_LIMIT_MAX || '150', 10),
};

// Derive allowed origins dynamically from environment without hard-coding production domains
const rawOrigins = [
  ENV.CLIENT_URL,
  process.env.CLIENT_URL,
  process.env.APP_URL,
  process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : [],
  ENV.NODE_ENV !== 'production'
    ? ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:3000', 'http://127.0.0.1:3000']
    : [],
]
  .flat()
  .filter(Boolean)
  .map((url) => String(url).trim().replace(/\/$/, ''));

export const ALLOWED_ORIGINS = Array.from(new Set(rawOrigins));

