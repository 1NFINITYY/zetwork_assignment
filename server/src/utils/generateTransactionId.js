const crypto = require('crypto');

/**
 * Generates a unique transaction ID.
 * Format: TXN + timestamp (base36) + 6 random hex chars
 * Example: TXN1K8Z3F2B4A1
 */
const generateTransactionId = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `TXN${timestamp}${random}`;
};

module.exports = generateTransactionId;
