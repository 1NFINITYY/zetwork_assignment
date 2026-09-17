const express = require('express');
const router = express.Router();
const { register, login, logout, me } = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');
const { registerSchema, loginSchema, validate } = require('../validators/authValidators');

// POST /api/v1/auth/register
router.post('/register', authLimiter, validate(registerSchema), register);

// POST /api/v1/auth/login
router.post('/login', authLimiter, validate(loginSchema), login);

// POST /api/v1/auth/logout
router.post('/logout', logout);

// GET /api/v1/auth/me
router.get('/me', authenticate, me);

module.exports = router;
