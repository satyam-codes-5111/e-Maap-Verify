import { ApiError } from '../utils/ApiError.js';

/**
 * Role-based authorization middleware (authorize / restrictTo)
 * @param  {...string} roles Allowed roles for the endpoint
 */
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(ApiError.unauthorized('Authentication required before role verification.'));
    }

    // Check if user's role is in permitted roles list
    if (!roles.includes(req.user.role)) {
      return next(
        ApiError.forbidden(
          `Forbidden: Role '${req.user.role}' is not authorized to access this resource. Allowed roles: [${roles.join(', ')}]`
        )
      );
    }

    next();
  };
};

// Export restrictTo as alias for authorize
export const restrictTo = authorize;
