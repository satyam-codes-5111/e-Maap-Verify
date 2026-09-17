import { ApiError } from '../utils/ApiError.js';
import {
  hasMongoOperators,
  hasPrototypePollution,
  containsXssPayloads,
  deepSanitize,
} from '../utils/securityUtils.js';

/**
 * Global Input Validation, Injection & Request Security Middleware
 * Inspects all incoming HTTP requests before reaching business logic handlers.
 */
export const requestSecurityMiddleware = (req, res, next) => {
  try {
    // 1. Prototype Pollution Defense
    const rawUrl = req.originalUrl || req.url || '';
    let decodedUrl = rawUrl;
    try {
      decodedUrl = decodeURIComponent(rawUrl);
    } catch {
      // decoded fallback
    }

    if (
      decodedUrl.includes('__proto__') ||
      decodedUrl.includes('constructor[prototype]') ||
      decodedUrl.includes('constructor.prototype') ||
      decodedUrl.includes('constructor%5Bprototype%5D') ||
      hasPrototypePollution(req.query) ||
      hasPrototypePollution(req.body) ||
      hasPrototypePollution(req.params)
    ) {
      return next(
        ApiError.badRequest(
          'Security Violation: Prototype pollution payloads (__proto__, constructor, prototype) are strictly prohibited.'
        )
      );
    }

    // 2. NoSQL Operator Injection Defense ($ne, $gt, $gte, $regex, $or, $in, etc.)
    if (
      hasMongoOperators(req.query) ||
      hasMongoOperators(req.body) ||
      hasMongoOperators(req.params)
    ) {
      return next(
        ApiError.badRequest(
          'Security Violation: MongoDB query operators ($) and nested dot properties are strictly prohibited in user inputs.'
        )
      );
    }

    // 3. Content-Type Media Type Validation for mutation methods
    if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
      const rawContentType = req.headers['content-type'] || '';
      const contentLength = parseInt(req.headers['content-length'] || '0', 10);
      const hasBodyPayload =
        contentLength > 0 ||
        req.headers['transfer-encoding'] === 'chunked' ||
        (req.body && Object.keys(req.body).length > 0);

      if (hasBodyPayload && rawContentType) {
        const lowerType = rawContentType.toLowerCase();
        const isSupported =
          lowerType.includes('application/json') ||
          lowerType.includes('multipart/form-data') ||
          lowerType.includes('application/x-www-form-urlencoded');

        if (!isSupported) {
          return next(
            ApiError.unsupportedMediaType(
              `Unsupported Content-Type '${rawContentType}'. Supported media types are application/json, multipart/form-data, and application/x-www-form-urlencoded.`
            )
          );
        }
      }
    }

    // 4. XSS / Script Injection Defense (Active script tags, event handlers, javascript: URIs)
    if (containsXssPayloads(req.query) || containsXssPayloads(req.body)) {
      return next(
        ApiError.badRequest(
          'Security Violation: Cross-site scripting (XSS) payload containing active HTML, scripts, or event handlers detected.'
        )
      );
    }

    // 5. Stored XSS Prevention: Clean residual HTML from request body
    if (req.body && typeof req.body === 'object') {
      deepSanitize(req.body);
    }

    next();
  } catch (err) {
    next(err);
  }
};
