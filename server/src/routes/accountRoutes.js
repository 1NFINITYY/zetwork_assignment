const express = require('express');
const router = express.Router();
const { getMyAccount, getAccountByNumber } = require('../controllers/accountController');
const { authenticate } = require('../middleware/auth');

// All account routes require authentication
router.use(authenticate);

// GET /api/v1/accounts/me
router.get('/me', getMyAccount);

// GET /api/v1/accounts/:accountNumber
router.get('/:accountNumber', getAccountByNumber);

module.exports = router;
