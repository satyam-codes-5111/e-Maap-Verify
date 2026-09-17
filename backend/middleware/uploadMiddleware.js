import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { ApiError } from '../utils/ApiError.js';
import { ENV } from '../config/env.js';
import {
  ALLOWED_MIME_TYPES,
  ALLOWED_EXTENSIONS,
  DANGEROUS_EXTENSIONS,
} from '../utils/fileSecurity.js';

// Configure storage engine with dynamic directory routing
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let subfolder = 'documents';
    const field = String(file.fieldname || '').toLowerCase();

    if (field.includes('photo') || field.includes('evidence')) {
      subfolder = 'instrument-photos';
    } else if (field.includes('cert')) {
      subfolder = 'certificates';
    }

    const baseDir = path.resolve(ENV.UPLOAD_DIR);
    const destPath = path.resolve(baseDir, subfolder);

    // Prevent directory breakout
    if (!destPath.startsWith(baseDir)) {
      return cb(ApiError.badRequest('Security violation: Invalid upload destination directory.'));
    }

    // Ensure directory exists
    if (!fs.existsSync(destPath)) {
      fs.mkdirSync(destPath, { recursive: true });
    }

    cb(null, destPath);
  },
  filename: (req, file, cb) => {
    // Reject filenames with null bytes or control characters immediately to prevent path errors
    if (file.originalname && /[\0\r\n\t]/.test(file.originalname)) {
      return cb(
        ApiError.badRequest('Security violation: Malicious characters or null bytes in filename.')
      );
    }

    const uniqueSuffix = `${Date.now()}-${crypto.randomBytes(12).toString('hex')}`;
    const cleanFieldname = String(file.fieldname || 'file')
      .replace(/[^a-zA-Z0-9_-]/g, '')
      .substring(0, 30) || 'file';

    let rawExt = path.extname(String(file.originalname || '')).toLowerCase();

    // Map extension strictly from allowed set or MIME
    let safeExt = '.bin';
    if (ALLOWED_EXTENSIONS.includes(rawExt)) {
      safeExt = rawExt;
    } else {
      const mimeMap = {
        'image/jpeg': '.jpg',
        'image/png': '.png',
        'image/webp': '.webp',
        'application/pdf': '.pdf',
      };
      safeExt = mimeMap[file.mimetype] || '.bin';
    }

    cb(null, `${cleanFieldname}-${uniqueSuffix}${safeExt}`);
  },
});

// File filter for safety
const fileFilter = (req, file, cb) => {
  // 1. Check MIME type
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    return cb(
      ApiError.badRequest(
        `Invalid file type '${file.mimetype}'. Only JPEG, PNG, WEBP images and PDF documents are permitted.`
      ),
      false
    );
  }

  const lowerName = String(file.originalname || '').toLowerCase();

  // 2. Reject path traversal or control characters in original filename
  if (/[\0\r\n\t]|\.\.|\/|\\|%2e|%2f|%5c/i.test(lowerName)) {
    return cb(
      ApiError.badRequest('Security violation: Malicious characters or path traversal in filename.'),
      false
    );
  }

  // 3. Reject dangerous extensions or double-extensions
  for (const dangerous of DANGEROUS_EXTENSIONS) {
    if (lowerName.endsWith(dangerous) || lowerName.includes(dangerous + '.')) {
      return cb(
        ApiError.badRequest(
          `Security violation: Disallowed or dangerous file extension '${dangerous}' detected.`
        ),
        false
      );
    }
  }

  cb(null, true);
};

export const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB maximum file size
  },
  fileFilter,
  preservePath: true,
});

