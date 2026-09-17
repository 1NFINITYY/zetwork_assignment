const { executeTransfer } = require('../services/transferService');
const { paiseToRupees } = require('../utils/moneyUtils');

/**
 * POST /api/v1/transfers
 *
 * Reads optional Idempotency-Key header for safe retries.
 * Amount in request body is in RUPEES.
 * Returns the created transaction record.
 */
const transfer = async (req, res, next) => {
  try {
    const { receiverAccountNumber, amount, description } = req.body;

    // Read idempotency key from header (spec section 19)
    const idempotencyKey = req.headers['idempotency-key'] || null;

    const transaction = await executeTransfer(
      req.user._id,
      receiverAccountNumber,
      amount, // rupees
      description,
      idempotencyKey
    );

    res.status(201).json({
      success: true,
      message: 'Transfer successful',
      data: {
        transactionId: transaction.transactionId,
        amountRupees: paiseToRupees(transaction.amountPaise),
        amountPaise: transaction.amountPaise,
        status: transaction.status,
        description: transaction.description,
        createdAt: transaction.createdAt,
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { transfer };
