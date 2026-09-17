/**
 * Money Utilities
 *
 * This application stores monetary values as INTEGER PAISE to avoid
 * IEEE 754 floating-point rounding errors in financial calculations.
 *
 * ₹1     = 100 paise
 * ₹100   = 10000 paise
 * ₹100.50 = 10050 paise
 *
 * All arithmetic is done in paise (integers).
 * Values are only converted to rupees for display purposes.
 */

/**
 * Convert rupees (float) to paise (integer).
 * @param {number} rupees - Rupee amount (e.g., 100.50)
 * @returns {number} Paise amount as integer (e.g., 10050)
 */
const rupeesToPaise = (rupees) => {
  if (typeof rupees !== 'number' || !isFinite(rupees)) {
    throw new Error('Invalid rupee amount');
  }
  return Math.round(rupees * 100);
};

/**
 * Convert paise (integer) to rupees (float, 2 decimal places).
 * @param {number} paise - Paise amount (e.g., 10050)
 * @returns {number} Rupee amount (e.g., 100.50)
 */
const paiseToRupees = (paise) => {
  return paise / 100;
};

/**
 * Format paise as INR currency string.
 * @param {number} paise
 * @returns {string} e.g., "₹100.50"
 */
const formatCurrency = (paise) => {
  const rupees = paiseToRupees(paise);
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
  }).format(rupees);
};

module.exports = { rupeesToPaise, paiseToRupees, formatCurrency };
