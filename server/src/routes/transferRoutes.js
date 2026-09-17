const express = require('express');
const router = express.Router();
const { transfer } = require('../controllers/transferController');
const { authenticate } = require('../middleware/auth');
const { transferLimiter } = require('../middleware/rateLimiter');
const { transferSchema, validate } = require('../validators/transferValidators');

// POST /api/v1/transfers
router.post('/', authenticate, transferLimiter, validate(transferSchema), transfer);

module.exports = router;
