import xss from 'xss';

// Strict XSS Filter for Legal Metrology Portal (Weights, Scales & Commercial Verification)
const xssFilter = new xss.FilterXSS({
  whiteList: {}, // No arbitrary HTML tags allowed in government form fields
  stripIgnoreTag: true,
  stripIgnoreTagBody: ['script', 'style', 'xml', 'iframe', 'object', 'embed'],
});

/**
 * Escape regular expression special characters to prevent ReDoS and regex injection.
 */
export function escapeRegex(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Check if string contains dangerous XSS payloads (scripts, javascript: URI, event handlers).
 */
export function hasXssPayload(val) {
  if (typeof val !== 'string') return false;
  const dangerousPatterns = /<script\b[^>]*>|javascript\s*:|\bon\w+\s*=\s*["']?[^"'>]+["']?|<\/?(?:iframe|svg|embed|object|link|meta)\b/i;
  return dangerousPatterns.test(val);
}

/**
 * Recursively check if an object contains keys starting with $ or containing . (NoSQL operator injection).
 */
export function hasMongoOperators(obj, depth = 0) {
  if (depth > 10 || !obj || typeof obj !== 'object') return false;
  for (const key of Object.keys(obj)) {
    if (key.startsWith('$') || key.includes('.')) {
      return true;
    }
    const val = obj[key];
    if (typeof val === 'object' && val !== null) {
      if (hasMongoOperators(val, depth + 1)) return true;
    }
  }
  return false;
}

/**
 * Recursively check if an object contains prototype pollution keys (__proto__, constructor, prototype).
 */
export function hasPrototypePollution(obj, depth = 0) {
  if (depth > 10 || !obj || typeof obj !== 'object') return false;
  for (const key of Object.keys(obj)) {
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
      return true;
    }
    const val = obj[key];
    if (typeof val === 'object' && val !== null) {
      if (hasPrototypePollution(val, depth + 1)) return true;
    }
  }
  return false;
}

/**
 * Recursively scan for XSS attack payloads in an object.
 */
export function containsXssPayloads(obj, depth = 0) {
  if (depth > 10 || !obj || typeof obj !== 'object') return false;
  for (const key of Object.keys(obj)) {
    // Skip checking password or token for XSS patterns (users may use special chars in passwords)
    if (key === 'password' || key === 'token' || key === 'refreshToken') {
      continue;
    }
    const val = obj[key];
    if (typeof val === 'string') {
      if (hasXssPayload(val)) return true;
    } else if (typeof val === 'object' && val !== null) {
      if (containsXssPayloads(val, depth + 1)) return true;
    }
  }
  return false;
}

/**
 * Recursively sanitize all string fields in an object to prevent Stored XSS.
 */
export function deepSanitize(obj, depth = 0) {
  if (depth > 10 || !obj || typeof obj !== 'object') return;
  for (const key of Object.keys(obj)) {
    if (key === 'password' || key === 'token' || key === 'refreshToken') {
      continue;
    }
    const val = obj[key];
    if (typeof val === 'string') {
      obj[key] = xssFilter.process(val).trim();
    } else if (typeof val === 'object' && val !== null) {
      deepSanitize(val, depth + 1);
    }
  }
}
