const env = require('../config/env');

/**
 * Centralized error handler middleware.
 *
 * All errors flow through here. AppError instances are operational errors
 * and get their status code + code forwarded. Unknown errors get 500.
 *
 * Response format (per spec section 15):
 * {
 *   "success": false,
 *   "message": "...",
 *   "code": "ERROR_CODE"
 * }
 */
const errorHandler = (err, req, res, next) => {
  // Default to 500 Internal Server Error
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Something went wrong';
  let code = err.code || 'INTERNAL_ERROR';

  // Handle Mongoose validation errors
  if (err.name === 'ValidationError') {
    statusCode = 400;
    code = 'VALIDATION_ERROR';
    const fields = Object.values(err.errors).map((e) => e.message);
    message = fields.join('. ');
  }

  // Handle Mongoose duplicate key errors
  if (err.code === 11000) {
    statusCode = 409;
    code = 'DUPLICATE_KEY';
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    message = `${field} already exists`;
  }

  // Handle Mongoose CastError (invalid ObjectId etc.)
  if (err.name === 'CastError') {
    statusCode = 400;
    code = 'INVALID_ID';
    message = `Invalid value for field: ${err.path}`;
  }

  // Log non-operational errors in dev
  if (!err.isOperational && env.NODE_ENV === 'development') {
    console.error('💥 Non-operational error:', err);
  }

  // Log all errors in production for monitoring
  if (env.NODE_ENV === 'production' && statusCode >= 500) {
    console.error('💥 Server error:', err);
  }

  res.status(statusCode).json({
    success: false,
    message,
    code,
    ...(env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = errorHandler;
