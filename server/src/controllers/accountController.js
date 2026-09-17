const accountService = require('../services/accountService');
const { paiseToRupees } = require('../utils/moneyUtils');

/**
 * GET /api/v1/accounts/me
 */
const getMyAccount = async (req, res, next) => {
  try {
    const account = await accountService.getMyAccount(req.user._id);

    res.json({
      success: true,
      data: {
        account: {
          id: account._id,
          accountNumber: account.accountNumber,
          balancePaise: account.balancePaise,
          balanceRupees: paiseToRupees(account.balancePaise),
          currency: account.currency,
          status: account.status,
          createdAt: account.createdAt,
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/v1/accounts/:accountNumber
 * Lookup a recipient's account details (for pre-transfer confirmation)
 */
const getAccountByNumber = async (req, res, next) => {
  try {
    const account = await accountService.getAccountByNumber(req.params.accountNumber);

    // Return limited info for recipient lookup (don't expose full balance)
    res.json({
      success: true,
      data: {
        account: {
          accountNumber: account.accountNumber,
          holderName: account.userId?.name || 'Account Holder',
          currency: account.currency,
          status: account.status,
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getMyAccount, getAccountByNumber };
