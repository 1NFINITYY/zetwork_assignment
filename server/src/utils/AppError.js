/**
 * AppError — Custom error class for operational errors.
 *
 * Usage:
 *   throw new AppError('Insufficient balance', 422, 'INSUFFICIENT_BALANCE');
 *
 * The centralized errorHandler middleware catches these and returns
 * consistent JSON: { success: false, message, code }
 */
class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true; // Distinguish operational from programming errors
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
