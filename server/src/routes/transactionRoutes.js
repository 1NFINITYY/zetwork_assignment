const express = require('express');
const router = express.Router();
const { getTransactions, getTransaction } = require('../controllers/transactionController');
const { authenticate } = require('../middleware/auth');

// All transaction routes require authentication
router.use(authenticate);

// GET /api/v1/transactions?page=1&limit=20
router.get('/', getTransactions);

// GET /api/v1/transactions/:transactionId
router.get('/:transactionId', getTransaction);

module.exports = router;
