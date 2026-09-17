import { ApiError } from '../utils/ApiError.js';
import { ENV } from '../config/env.js';
import { cleanupFile } from '../utils/fileSecurity.js';

export const errorHandler = (err, req, res, next) => {
  // Cleanup any temporary uploaded files on error to prevent orphan files
  if (req.file?.path) {
    cleanupFile(req.file.path);
  }
  if (Array.isArray(req.files)) {
    for (const f of req.files) {
      if (f.path) cleanupFile(f.path);
    }
  } else if (req.files && typeof req.files === 'object') {
    for (const key of Object.keys(req.files)) {
      const arr = req.files[key];
      if (Array.isArray(arr)) {
        for (const f of arr) {
          if (f.path) cleanupFile(f.path);
        }
      }
    }
  }

  let error = err;

  // Handle SyntaxError (e.g. malformed JSON payload from express.json or bad regex)
  if (err instanceof SyntaxError && (err.status === 400 || err.statusCode === 400) && 'body' in err) {
    error = ApiError.badRequest('Malformed JSON payload provided in request body.');
  } else if (err.name === 'SyntaxError') {
    error = ApiError.badRequest(`Syntax error in request: ${err.message}`);
  }

  // Handle Mongoose CastError (Invalid ObjectId or type cast)
  if (err.name === 'CastError') {
    const safeVal = String(err.value || '').substring(0, 50).replace(/[<>$]/g, '');
    const message = `Resource not found or invalid identifier format: ${safeVal}`;
    error = ApiError.badRequest(message);
  }

  // Handle Mongoose Duplicate Key Error (code 11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    const rawVal = err.keyValue ? err.keyValue[field] : '';
    const safeVal = String(rawVal).substring(0, 50).replace(/[<>$]/g, '');
    const message = `A record with ${field} '${safeVal}' already exists. Duplicate values are not allowed.`;
    error = ApiError.conflict(message);
  }

  // Handle Mongoose Validation Error
  if (err.name === 'ValidationError') {
    const validationErrors = Object.values(err.errors || {}).map((val) => ({
      field: val.path,
      message: val.message,
    }));
    error = ApiError.badRequest('Validation failed', validationErrors);
  }

  // Handle Multer upload errors
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      error = ApiError.badRequest('File size exceeds the permitted 5 MB limit.');
    } else {
      error = ApiError.badRequest(`File upload error: ${err.message}`);
    }
  } else if (err.code === 'LIMIT_FILE_SIZE') {
    error = ApiError.badRequest('File size exceeds the permitted 5 MB limit.');
  }

  // Handle invalid argument / null byte in path or filename
  if (
    err.code === 'ERR_INVALID_ARG_VALUE' ||
    (err.message &&
      (err.message.toLowerCase().includes('null byte') ||
        err.message.includes('Malformed part header') ||
        err.message.includes('Unexpected end of form')))
  ) {
    error = ApiError.badRequest('Security violation: Malformed upload header, invalid characters or null bytes in request.');
  }

  // Handle Payload Too Large (Express body-parser 413)
  if (err.type === 'entity.too.large' || err.status === 413 || err.statusCode === 413) {
    error = ApiError.payloadTooLarge('Payload Too Large: Request body exceeds the maximum permitted limit of 10MB.');
  }

  const statusCode = error.statusCode || error.status || 500;
  let message = error.message || 'Internal Server Error';
  let errors = error.errors || [];

  // Protect against information leakage on 500
  if (statusCode === 500) {
    console.error('Unhandled Internal Error:', err);
    message = 'An unexpected internal error occurred. Please contact system support.';
    errors = [];
  } else {
    // Sanitize any potential secret or file path traces from operational error messages
    const sanitizeText = (val) => {
      if (typeof val !== 'string') return val;
      let cleaned = val;
      if (ENV.JWT_SECRET) cleaned = cleaned.replaceAll(ENV.JWT_SECRET, '[REDACTED_SECRET]');
      if (ENV.MONGO_URI) cleaned = cleaned.replaceAll(ENV.MONGO_URI, '[REDACTED_URI]');
      if (ENV.SMTP_PASSWORD) cleaned = cleaned.replaceAll(ENV.SMTP_PASSWORD, '[REDACTED_SMTP_PASS]');
      if (ENV.SMTP_USER) cleaned = cleaned.replaceAll(ENV.SMTP_USER, '[REDACTED_SMTP_USER]');
      // Strip internal filesystem paths and node_modules paths, while keeping API paths (/api/...) intact
      cleaned = cleaned.replace(/(?:\/[a-zA-Z0-9_-]+)*\/(?:home|backend|node_modules|usr|var|tmp|etc|app|dist|src)\/[a-zA-Z0-9_\-./]+/gi, '[INTERNAL_PATH]');
      cleaned = cleaned.replace(/[a-zA-Z]:\\[a-zA-Z0-9_\-.\\]+/g, '[INTERNAL_PATH]');
      cleaned = cleaned.replace(/file:\/\/\S+/gi, '[INTERNAL_PATH]');
      return cleaned;
    };

    message = sanitizeText(message);
    if (Array.isArray(errors)) {
      errors = errors.map((e) => {
        if (typeof e === 'string') return sanitizeText(e);
        if (e && typeof e === 'object') {
          return {
            ...e,
            message: sanitizeText(e.message || ''),
          };
        }
        return e;
      });
    }
  }

  const responseBody = {
    success: false,
    message,
    errors,
  };

  // Stack traces, paths, and internal details are NEVER sent to the client
  return res.status(statusCode).json(responseBody);
};
