const { getTransactionHistory, getTransactionById } = require('../services/transactionService');
const { paiseToRupees } = require('../utils/moneyUtils');

/**
 * GET /api/v1/transactions?page=1&limit=20
 */
const getTransactions = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));

    const result = await getTransactionHistory(req.user._id, page, limit);

    // Convert paise to rupees for display
    const transactions = result.transactions.map((tx) => ({
      transactionId: tx.transactionId,
      type: tx.type,
      amountRupees: paiseToRupees(tx.amountPaise),
      amountPaise: tx.amountPaise,
      currency: tx.currency,
      status: tx.status,
      description: tx.description,
      otherAccount: tx.otherAccount,
      createdAt: tx.createdAt,
    }));

    res.json({
      success: true,
      data: {
        transactions,
        pagination: result.pagination,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/v1/transactions/:transactionId
 */
const getTransaction = async (req, res, next) => {
  try {
    const tx = await getTransactionById(req.params.transactionId, req.user._id);

    res.json({
      success: true,
      data: {
        transaction: {
          transactionId: tx.transactionId,
          type: tx.type,
          amountRupees: paiseToRupees(tx.amountPaise),
          amountPaise: tx.amountPaise,
          currency: tx.currency,
          status: tx.status,
          description: tx.description,
          otherAccount: tx.otherAccount,
          senderAccount: tx.senderAccountId?.accountNumber,
          receiverAccount: tx.receiverAccountId?.accountNumber,
          createdAt: tx.createdAt,
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getTransactions, getTransaction };
