const Account = require('../models/Account');
const AppError = require('../utils/AppError');

/**
 * Get the bank account belonging to the current user.
 */
const getMyAccount = async (userId) => {
  const account = await Account.findOne({ userId });
  if (!account) {
    throw new AppError('Bank account not found', 404, 'ACCOUNT_NOT_FOUND');
  }
  return account;
};

/**
 * Look up an account by account number (for recipient lookup).
 * Returns public-safe fields only.
 */
const getAccountByNumber = async (accountNumber) => {
  const account = await Account.findOne({ accountNumber }).populate('userId', 'name');
  if (!account) {
    throw new AppError('Account not found', 404, 'ACCOUNT_NOT_FOUND');
  }
  return account;
};

module.exports = { getMyAccount, getAccountByNumber };
