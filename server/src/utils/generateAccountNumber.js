const Account = require('../models/Account');

/**
 * Generates a unique 10-digit account number starting with 10.
 * Retries on collision (extremely rare).
 */
const generateAccountNumber = async () => {
  const MAX_ATTEMPTS = 5;

  for (let i = 0; i < MAX_ATTEMPTS; i++) {
    // 10 + 8 random digits = 10-digit number starting with 10
    const random = Math.floor(Math.random() * 100_000_000)
      .toString()
      .padStart(8, '0');
    const accountNumber = `10${random}`;

    const existing = await Account.findOne({ accountNumber });
    if (!existing) return accountNumber;
  }

  throw new Error('Failed to generate unique account number after multiple attempts');
};

module.exports = generateAccountNumber;
