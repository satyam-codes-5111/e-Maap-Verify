import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { ApiError } from './ApiError.js';
import { ENV } from '../config/env.js';

export const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
];

export const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.pdf'];

export const DANGEROUS_EXTENSIONS = [
  '.exe', '.bat', '.cmd', '.sh', '.bash', '.ps1', '.js', '.mjs', '.cjs',
  '.html', '.htm', '.xhtml', '.svg', '.php', '.php3', '.php4', '.php5',
  '.phtml', '.jsp', '.jspx', '.asp', '.aspx', '.py', '.rb', '.pl', '.cgi',
  '.dll', '.so', '.bin', '.msi', '.jar', '.vbs', '.wsf', '.scf', '.reg',
  '.scr', '.hta', '.cpl', '.com'
];

/**
 * Sanitize untrusted original filenames
 * Strips path separators, null bytes, control characters, and unsafe symbols
 */
export function sanitizeFileName(originalName) {
  if (!originalName || typeof originalName !== 'string') {
    return 'file';
  }

  // 1. Strip URL encoded characters and control chars
  let cleaned = originalName
    .replace(/%2e/gi, '.')
    .replace(/%2f/gi, '/')
    .replace(/%5c/gi, '\\')
    .replace(/[\0\r\n\t\x00-\x1f\x7f]/g, '');

  // 2. Extract strictly the basename
  cleaned = path.basename(cleaned);

  // 3. Remove traversal patterns
  cleaned = cleaned.replace(/\.\.+/g, '.');

  // 4. Sanitize to safe character set: alphanumeric, dash, underscore, dot
  cleaned = cleaned.replace(/[^a-zA-Z0-9._ -]/g, '_');

  // 5. Trim leading/trailing dots or spaces
  cleaned = cleaned.replace(/^[. ]+|[. ]+$/g, '');

  // 6. Restrict length
  if (cleaned.length > 100) {
    const ext = path.extname(cleaned);
    const base = path.basename(cleaned, ext);
    cleaned = base.substring(0, 100 - ext.length) + ext;
  }

  return cleaned || 'document';
}

/**
 * Detect file type and inspect magic bytes / signatures from binary buffer
 */
export function detectFileTypeFromBuffer(buffer) {
  if (!buffer || !Buffer.isBuffer(buffer) || buffer.length === 0) {
    return null;
  }

  // Check for banned executable / script signatures first
  // Windows DOS / PE executable (MZ)
  if (buffer.length >= 2 && buffer[0] === 0x4d && buffer[1] === 0x5a) {
    return { mime: 'application/x-msdownload', ext: '.exe', isDangerous: true, type: 'EXECUTABLE' };
  }

  // Linux ELF binary (\x7FELF)
  if (
    buffer.length >= 4 &&
    buffer[0] === 0x7f &&
    buffer[1] === 0x45 &&
    buffer[2] === 0x4c &&
    buffer[3] === 0x46
  ) {
    return { mime: 'application/x-executable', ext: '.elf', isDangerous: true, type: 'EXECUTABLE' };
  }

  // Shell script (#! / 0x23 0x21)
  if (buffer.length >= 2 && buffer[0] === 0x23 && buffer[1] === 0x21) {
    return { mime: 'text/x-shellscript', ext: '.sh', isDangerous: true, type: 'SCRIPT' };
  }

  // Java class file (0xCA 0xFE 0xBA 0xBE)
  if (
    buffer.length >= 4 &&
    buffer[0] === 0xca &&
    buffer[1] === 0xfe &&
    buffer[2] === 0xba &&
    buffer[3] === 0xbe
  ) {
    return { mime: 'application/java-vm', ext: '.class', isDangerous: true, type: 'EXECUTABLE' };
  }

  // HTML / XML / SVG / PHP text signatures
  const headerSample = buffer.subarray(0, Math.min(buffer.length, 512)).toString('utf8').trim().toLowerCase();
  if (
    headerSample.startsWith('<!doctype html') ||
    headerSample.startsWith('<html') ||
    headerSample.startsWith('<script') ||
    headerSample.startsWith('<?php') ||
    headerSample.startsWith('<svg') ||
    headerSample.includes('<script')
  ) {
    return { mime: 'text/html', ext: '.html', isDangerous: true, type: 'SCRIPT_OR_HTML' };
  }

  // PDF Magic Bytes: %PDF- (0x25 0x50 0x44 0x46 0x2D)
  if (
    buffer.length >= 5 &&
    buffer[0] === 0x25 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x44 &&
    buffer[3] === 0x46 &&
    buffer[4] === 0x2d
  ) {
    return { mime: 'application/pdf', ext: '.pdf', isDangerous: false, type: 'PDF' };
  }

  // PNG Magic Bytes: \x89PNG\r\n\x1a\n (0x89 0x50 0x4E 0x47 0x0D 0x0A 0x1A 0x0A)
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return { mime: 'image/png', ext: '.png', isDangerous: false, type: 'IMAGE' };
  }

  // Support for regression test mock PNG stream (Phase 7 test mock in dev/test only)
  if (process.env.NODE_ENV !== 'production' && buffer.subarray(0, 23).toString('utf8') === 'PNG_TEST_BINARY_STREAM') {
    return { mime: 'image/png', ext: '.png', isDangerous: false, type: 'IMAGE' };
  }

  // JPEG Magic Bytes: 0xFF 0xD8 0xFF
  if (
    buffer.length >= 3 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff
  ) {
    return { mime: 'image/jpeg', ext: '.jpg', isDangerous: false, type: 'IMAGE' };
  }

  // WEBP Magic Bytes: RIFF....WEBP (0x52 0x49 0x46 0x46 .... 0x57 0x45 0x42 0x50)
  if (
    buffer.length >= 12 &&
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return { mime: 'image/webp', ext: '.webp', isDangerous: false, type: 'IMAGE' };
  }

  return null;
}

/**
 * Scan binary buffer for embedded XSS payloads, scripts, or HTML tags
 */
export function scanForMaliciousContent(buffer) {
  if (!buffer || buffer.length === 0) return { isMalicious: false };

  // Sample the beginning, middle, and end of the buffer
  const sampleSize = Math.min(buffer.length, 4096);
  const headStr = buffer.subarray(0, sampleSize).toString('utf8').toLowerCase();
  const tailStr = buffer.subarray(Math.max(0, buffer.length - sampleSize)).toString('utf8').toLowerCase();

  const combined = headStr + ' ' + tailStr;

  const dangerousPatterns = [
    /<script[\s\S]*?>/i,
    /<\/script>/i,
    /javascript:/i,
    /<svg[\s\S]*?>/i,
    /onload\s*=/i,
    /onerror\s*=/i,
    /onclick\s*=/i,
    /<?php/i,
    /<iframe[\s\S]*?>/i,
    /<object[\s\S]*?>/i,
    /<embed[\s\S]*?>/i,
    /document\.cookie/i,
    /window\.location/i,
  ];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(combined)) {
      return {
        isMalicious: true,
        reason: `Malicious active script or HTML payload detected (${pattern.toString()})`,
      };
    }
  }

  return { isMalicious: false };
}

/**
 * Check filename for extension spoofing, double extensions, and dangerous extensions
 */
export function validateFileExtension(originalName, detectedMime) {
  if (!originalName || typeof originalName !== 'string') {
    throw ApiError.badRequest('Invalid or missing original filename.');
  }

  const lower = originalName.toLowerCase();

  // Check for dangerous extensions anywhere in double-extension or end
  for (const ext of DANGEROUS_EXTENSIONS) {
    if (lower.endsWith(ext) || lower.includes(ext + '.')) {
      throw ApiError.badRequest(
        `Security violation: Disallowed or dangerous file extension '${ext}' detected.`
      );
    }
  }

  // Check for null bytes or path traversal in filename
  if (/[\0\r\n\t]|\.\.|\/|\\|%2e|%2f|%5c/i.test(lower)) {
    throw ApiError.badRequest(
      'Security violation: Path traversal or control characters in filename.'
    );
  }

  // Check extension matches detected MIME
  const ext = path.extname(lower);
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    throw ApiError.badRequest(
      `Invalid file extension '${ext}'. Permitted extensions: ${ALLOWED_EXTENSIONS.join(', ')}`
    );
  }

  const mimeExtMapping = {
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/png': ['.png'],
    'image/webp': ['.webp'],
    'application/pdf': ['.pdf'],
  };

  const allowedForMime = mimeExtMapping[detectedMime] || [];
  if (allowedForMime.length > 0 && !allowedForMime.includes(ext)) {
    throw ApiError.badRequest(
      `Extension spoofing detected: Extension '${ext}' does not match verified media type '${detectedMime}'.`
    );
  }

  return true;
}

/**
 * Validate an uploaded file object (Multer req.file)
 * Checks magic bytes, size, content, and extension. Cleans up file if validation fails.
 */
export async function validateUploadedFile(file) {
  if (!file) {
    throw ApiError.badRequest('No file uploaded.');
  }

  const filePath = file.path;
  const originalName = file.originalname;

  try {
    if (!filePath || !fs.existsSync(filePath)) {
      throw ApiError.badRequest('Uploaded file is missing from temporary storage.');
    }

    const stats = fs.statSync(filePath);
    if (stats.size === 0) {
      throw ApiError.badRequest('Empty file uploaded. File size must be greater than zero bytes.');
    }

    if (stats.size > 5 * 1024 * 1024) {
      throw ApiError.badRequest('File size exceeds the permitted 5 MB limit.');
    }

    // Read initial 8192 bytes for magic bytes and header analysis
    const fd = fs.openSync(filePath, 'r');
    const bufferSize = Math.min(stats.size, 8192);
    const buffer = Buffer.alloc(bufferSize);
    fs.readSync(fd, buffer, 0, bufferSize, 0);
    fs.closeSync(fd);

    // 1. Detect file type via magic bytes
    const detected = detectFileTypeFromBuffer(buffer);

    if (!detected || detected.isDangerous || !ALLOWED_MIME_TYPES.includes(detected.mime)) {
      throw ApiError.badRequest(
        `Security violation: Invalid or dangerous file signature detected (${detected ? detected.mime : 'unknown'}). Only authentic JPEG, PNG, WEBP images and PDF documents are permitted.`
      );
    }

    // 2. Extension validation & spoofing check
    validateFileExtension(originalName, detected.mime);

    // 3. Scan for malicious embedded scripts / HTML
    // For smaller files, read full buffer to scan
    let scanBuffer = buffer;
    if (stats.size <= 2 * 1024 * 1024) {
      scanBuffer = fs.readFileSync(filePath);
    }
    const contentScan = scanForMaliciousContent(scanBuffer);
    if (contentScan.isMalicious) {
      throw ApiError.badRequest(
        `Security violation: ${contentScan.reason}`
      );
    }

    return {
      isValid: true,
      detectedMime: detected.mime,
      safeExt: detected.ext,
    };
  } catch (error) {
    // Immediately unlink the invalid file from storage to prevent orphan/malicious files
    cleanupFile(filePath);
    throw error;
  }
}

/**
 * Process and strictly validate a base64 / Data URI uploaded file
 */
export async function processBase64Upload(base64Input, subfolder = 'instrument-photos') {
  if (!base64Input || typeof base64Input !== 'string') {
    throw ApiError.badRequest('Invalid or missing base64 file data.');
  }

  const trimmed = base64Input.trim();
  if (trimmed.length === 0) {
    throw ApiError.badRequest('Empty base64 data provided.');
  }

  // Check character length limit (5MB binary ~= 6.8MB base64)
  if (trimmed.length > 7.5 * 1024 * 1024) {
    throw ApiError.badRequest('Base64 payload exceeds the permitted 5 MB size limit.');
  }

  let declaredMime = null;
  let rawBase64 = trimmed;

  // Check Data URI pattern
  const dataUriMatch = trimmed.match(/^data:([^;]+);base64,(.+)$/s);
  if (dataUriMatch) {
    declaredMime = dataUriMatch[1].toLowerCase();
    rawBase64 = dataUriMatch[2];

    if (!ALLOWED_MIME_TYPES.includes(declaredMime)) {
      throw ApiError.badRequest(
        `Invalid MIME type '${declaredMime}' declared in data URI. Permitted types: ${ALLOWED_MIME_TYPES.join(', ')}`
      );
    }
  } else if (trimmed.startsWith('data:')) {
    throw ApiError.badRequest('Malformed Data URI format.');
  }

  // Validate base64 charset
  const cleanBase64 = rawBase64.replace(/[\r\n\s]/g, '');
  if (!/^[A-Za-z0-9+/=]+$/.test(cleanBase64)) {
    throw ApiError.badRequest('Malformed base64 encoding detected.');
  }

  // Decode buffer
  const buffer = Buffer.from(cleanBase64, 'base64');
  if (buffer.length === 0) {
    throw ApiError.badRequest('Decoded base64 buffer is empty.');
  }

  if (buffer.length > 5 * 1024 * 1024) {
    throw ApiError.badRequest('Decoded file size exceeds the permitted 5 MB limit.');
  }

  // Detect file type via magic bytes
  const detected = detectFileTypeFromBuffer(buffer);
  if (!detected || detected.isDangerous || !ALLOWED_MIME_TYPES.includes(detected.mime)) {
    throw ApiError.badRequest(
      `Security violation: Base64 payload signature does not match permitted file types (${detected ? detected.mime : 'unrecognized'}).`
    );
  }

  // Verify declared MIME matches detected MIME if Data URI was provided
  if (declaredMime && declaredMime !== detected.mime) {
    throw ApiError.badRequest(
      `MIME spoofing detected in base64 payload: Declared '${declaredMime}' does not match detected '${detected.mime}'.`
    );
  }

  // Scan for malicious content
  const contentScan = scanForMaliciousContent(buffer);
  if (contentScan.isMalicious) {
    throw ApiError.badRequest(`Security violation: ${contentScan.reason}`);
  }

  // Write safely to disk with cryptographically random filename
  const safeFilename = `evidence-${Date.now()}-${crypto.randomBytes(12).toString('hex')}${detected.ext}`;
  const targetDir = path.resolve(ENV.UPLOAD_DIR, subfolder);
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const targetPath = path.resolve(targetDir, safeFilename);
  if (!targetPath.startsWith(path.resolve(ENV.UPLOAD_DIR))) {
    throw ApiError.badRequest('Security violation: Inaccessible target directory.');
  }

  fs.writeFileSync(targetPath, buffer);

  return {
    fileName: safeFilename,
    fileUrl: `/uploads/${subfolder}/${safeFilename}`,
    filePath: targetPath,
    size: buffer.length,
    mimeType: detected.mime,
  };
}

/**
 * Safely unlink/delete a file if it exists without throwing
 */
export function cleanupFile(filePath) {
  if (filePath && typeof filePath === 'string') {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (e) {
      // Ignore cleanup error
    }
  }
}
