/**
 * Centralized API Error class for standard operational HTTP errors
 */
export class ApiError extends Error {
  constructor(statusCode, message, errors = [], stack = '') {
    super(message);
    this.statusCode = statusCode;
    this.data = null;
    this.message = message;
    this.success = false;
    this.errors = errors;

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  static badRequest(msg = 'Bad Request', errors = []) {
    return new ApiError(400, msg, errors);
  }

  static unauthorized(msg = 'Unauthorized access') {
    return new ApiError(401, msg);
  }

  static forbidden(msg = 'Forbidden: Insufficient role permissions') {
    return new ApiError(403, msg);
  }

  static notFound(msg = 'Requested resource not found') {
    return new ApiError(404, msg);
  }

  static methodNotAllowed(msg = 'Method Not Allowed') {
    return new ApiError(405, msg);
  }

  static conflict(msg = 'Conflict: Resource already exists') {
    return new ApiError(409, msg);
  }

  static payloadTooLarge(msg = 'Payload Too Large') {
    return new ApiError(413, msg);
  }

  static unsupportedMediaType(msg = 'Unsupported Media Type') {
    return new ApiError(415, msg);
  }

  static unprocessable(msg = 'Unprocessable Entity', errors = []) {
    return new ApiError(422, msg, errors);
  }

  static tooManyRequests(msg = 'Too Many Requests') {
    return new ApiError(429, msg);
  }

  static internal(msg = 'Internal server error') {
    return new ApiError(500, msg);
  }
}
