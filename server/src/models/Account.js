const mongoose = require('mongoose');

/**
 * Account Model
 *
 * Money (balance) is stored as INTEGER PAISE to avoid floating-point errors.
 * Example: ₹100.50 is stored as 10050 paise.
 * All transfer logic works with integer paise.
 * Display conversion: paise / 100 → rupees.
 */
const accountSchema = new mongoose.Schema(
  {
    accountNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // Stored in PAISE (integer) to avoid floating-point issues
    // ₹1 = 100 paise, ₹100.50 = 10050 paise
    balancePaise: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Balance cannot be negative'],
      get: (v) => Math.round(v), // Ensure integer on read
    },
    currency: {
      type: String,
      default: 'INR',
      enum: ['INR'],
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'FROZEN', 'CLOSED'],
      default: 'ACTIVE',
    },
  },
  {
    timestamps: true,
    toJSON: { getters: true },
    toObject: { getters: true },
  }
);

// accountNumber already has unique:true above.
// Additional index on userId for lookup performance.
accountSchema.index({ userId: 1 });

const Account = mongoose.model('Account', accountSchema);
module.exports = Account;
