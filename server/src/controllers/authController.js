const jwt = require('jsonwebtoken');
const authService = require('../services/authService');
const env = require('../config/env');

/**
 * Cookie options
 * Production (cross-origin): SameSite=None + Secure=true
 *   Required when frontend (Vercel) and backend (Render) are on different domains.
 *   SameSite=Strict/Lax blocks cookies cross-origin.
 * Development (same-origin via Vite proxy): SameSite=Lax
 */
const isProduction = env.NODE_ENV === 'production';
const cookieOptions = {
  httpOnly: true,
  secure: isProduction,           // HTTPS only in production
  sameSite: isProduction ? 'none' : 'lax',  // 'none' required for cross-origin in prod
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
};

const clearCookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? 'none' : 'lax',
};

/**
 * POST /api/v1/auth/register
 */
const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    const { user, account } = await authService.registerUser({ name, email, password });

    // Issue JWT immediately on registration
    const jwt = require('jsonwebtoken');
    const token = jwt.sign({ userId: user._id, email: user.email }, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN,
    });

    res.cookie('token', token, cookieOptions);

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
        },
        account: {
          accountNumber: account.accountNumber,
          balancePaise: account.balancePaise,
          currency: account.currency,
          status: account.status,
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/v1/auth/login
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const { user, token } = await authService.loginUser({ email, password });

    res.cookie('token', token, cookieOptions);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/v1/auth/logout
 */
const logout = (req, res) => {
  res.clearCookie('token', clearCookieOptions);
  res.json({ success: true, message: 'Logged out successfully' });
};

/**
 * GET /api/v1/auth/me
 */
const me = (req, res) => {
  res.json({
    success: true,
    data: {
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
      },
    },
  });
};

/**
 * GET /api/v1/auth/socket-token
 * Returns a short-lived (30s) JWT for Socket.IO handshake authentication.
 * The Vite WS proxy does not forward cookies, so we use this REST endpoint
 * to get a token and pass it in io({ auth: { token } }).
 */
const getSocketToken = (req, res) => {
  const socketToken = jwt.sign(
    { userId: req.user._id, email: req.user.email, type: 'socket' },
    env.JWT_SECRET,
    { expiresIn: '60s' }
  );
  res.json({ success: true, data: { token: socketToken } });
};

module.exports = { register, login, logout, me, getSocketToken };
