const authService = require('../services/authService');
const env = require('../config/env');

/**
 * Cookie options — HTTP-only, Secure (in production), SameSite=Strict
 */
const cookieOptions = {
  httpOnly: true, // Not accessible via JavaScript
  secure: env.NODE_ENV === 'production', // HTTPS only in production
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
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
  res.clearCookie('token', {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'strict',
  });
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

module.exports = { register, login, logout, me };
