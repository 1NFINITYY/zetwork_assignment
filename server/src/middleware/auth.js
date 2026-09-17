const jwt = require('jsonwebtoken');
const env = require('../config/env');
const AppError = require('../utils/AppError');
const User = require('../models/User');

/**
 * Authentication middleware.
 * Reads JWT from HTTP-only cookie and attaches the user to req.user.
 */
const authenticate = async (req, res, next) => {
  try {
    // Read token from HTTP-only cookie (secure, not accessible by JS)
    const token = req.cookies?.token;

    if (!token) {
      throw new AppError('Not authenticated. Please log in.', 401, 'UNAUTHORIZED');
    }

    // Verify token
    const decoded = jwt.verify(token, env.JWT_SECRET);

    // Check user still exists
    const user = await User.findById(decoded.userId);
    if (!user) {
      throw new AppError('User no longer exists.', 401, 'UNAUTHORIZED');
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError') {
      return next(new AppError('Invalid token.', 401, 'UNAUTHORIZED'));
    }
    if (err.name === 'TokenExpiredError') {
      return next(new AppError('Token expired. Please log in again.', 401, 'UNAUTHORIZED'));
    }
    next(err);
  }
};

module.exports = { authenticate };
