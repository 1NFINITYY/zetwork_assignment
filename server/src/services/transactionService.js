const Transaction = require('../models/Transaction');
const Account = require('../models/Account');
const AppError = require('../utils/AppError');

/**
 * Get paginated transaction history for the current user.
 * Returns transactions where user is sender OR receiver.
 */
const getTransactionHistory = async (userId, page = 1, limit = 20) => {
  // Find user's account
  const account = await Account.findOne({ userId });
  if (!account) {
    throw new AppError('Account not found', 404, 'ACCOUNT_NOT_FOUND');
  }

  const skip = (page - 1) * limit;

  const [transactions, total] = await Promise.all([
    Transaction.find({
      $or: [
        { senderAccountId: account._id },
        { receiverAccountId: account._id },
      ],
    })
      .sort({ createdAt: -1 }) // Most recent first
      .skip(skip)
      .limit(limit)
      .populate('senderAccountId', 'accountNumber')
      .populate('receiverAccountId', 'accountNumber')
      .lean(),

    Transaction.countDocuments({
      $or: [
        { senderAccountId: account._id },
        { receiverAccountId: account._id },
      ],
    }),
  ]);

  // Add type (SENT/RECEIVED) from this user's perspective
  const enriched = transactions.map((tx) => ({
    ...tx,
    type: tx.senderAccountId._id.toString() === account._id.toString() ? 'SENT' : 'RECEIVED',
    otherAccount:
      tx.senderAccountId._id.toString() === account._id.toString()
        ? tx.receiverAccountId.accountNumber
        : tx.senderAccountId.accountNumber,
  }));

  return {
    transactions: enriched,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page < Math.ceil(total / limit),
      hasPrevPage: page > 1,
    },
  };
};

/**
 * Get a single transaction by its transactionId.
 * Only accessible if the user is sender or receiver.
 */
const getTransactionById = async (transactionId, userId) => {
  const account = await Account.findOne({ userId });
  if (!account) {
    throw new AppError('Account not found', 404, 'ACCOUNT_NOT_FOUND');
  }

  const tx = await Transaction.findOne({ transactionId })
    .populate('senderAccountId', 'accountNumber')
    .populate('receiverAccountId', 'accountNumber');

  if (!tx) {
    throw new AppError('Transaction not found', 404, 'TRANSACTION_NOT_FOUND');
  }

  // Authorization check — user must be party to the transaction
  const isSender = tx.senderAccountId._id.toString() === account._id.toString();
  const isReceiver = tx.receiverAccountId._id.toString() === account._id.toString();
  if (!isSender && !isReceiver) {
    throw new AppError('Not authorized to view this transaction', 403, 'UNAUTHORIZED');
  }

  return {
    ...tx.toObject(),
    type: isSender ? 'SENT' : 'RECEIVED',
    otherAccount: isSender
      ? tx.receiverAccountId.accountNumber
      : tx.senderAccountId.accountNumber,
  };
};

module.exports = { getTransactionHistory, getTransactionById };
