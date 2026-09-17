const rateLimit = require('express-rate-limit');

/**
 * Rate Limiter Middleware (spec section 18)
 *
 * authLimiter    — Protects /login and /register (10 req / 15 min per IP)
 * transferLimiter — Protects /transfers (5 req / 1 min per IP)
 * generalLimiter  — Global API rate limit (100 req / 15 min per IP)
 *
 * ⚠️  Rate limiting is ONLY active in production.
 * In development and test environments it is disabled so that:
 *  - Developers can refresh/test freely without hitting 429s
 *  - Integration tests can register multiple users without limits
 */

const isDev = process.env.NODE_ENV !== 'production';

// Pass-through middleware for non-production environments
const noLimit = (req, res, next) => next();

const authLimiter = isDev
  ? noLimit
  : rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 10,
      message: {
        success: false,
        message: 'Too many attempts. Please try again in 15 minutes.',
        code: 'RATE_LIMITED',
      },
      standardHeaders: true,
      legacyHeaders: false,
    });

const transferLimiter = isDev
  ? noLimit
  : rateLimit({
      windowMs: 60 * 1000, // 1 minute
      max: 5,
      message: {
        success: false,
        message: 'Too many transfer requests. Please slow down.',
        code: 'RATE_LIMITED',
      },
      standardHeaders: true,
      legacyHeaders: false,
    });

const generalLimiter = isDev
  ? noLimit
  : rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100,
      message: {
        success: false,
        message: 'Too many requests. Please try again later.',
        code: 'RATE_LIMITED',
      },
      standardHeaders: true,
      legacyHeaders: false,
    });

module.exports = { authLimiter, transferLimiter, generalLimiter };
