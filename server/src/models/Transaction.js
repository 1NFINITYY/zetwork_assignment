const mongoose = require('mongoose');

/**
 * Transaction / Ledger Model
 *
 * Records are EFFECTIVELY IMMUTABLE — there are no UPDATE or DELETE routes.
 * Each transfer creates one Transaction record.
 * senderAccountId and receiverAccountId are used to look up "sent" or "received" from user context.
 *
 * Amount stored in PAISE (integer).
 */
const transactionSchema = new mongoose.Schema(
  {
    transactionId: {
      type: String,
      required: true,
      unique: true,
    },
    senderAccountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Account',
      required: true,
    },
    receiverAccountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Account',
      required: true,
    },
    // Amount in PAISE
    amountPaise: {
      type: Number,
      required: true,
      min: [1, 'Amount must be at least 1 paise'],
    },
    currency: {
      type: String,
      default: 'INR',
    },
    status: {
      type: String,
      enum: ['SUCCESS', 'FAILED'],
      required: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 200,
      default: '',
    },
    // Idempotency key to prevent duplicate transfers on network retry
    // Sparse so that transactions without a key don't conflict
    idempotencyKey: {
      type: String,
      sparse: true,
      default: null,
    },
  },
  {
    timestamps: true,
    // Prevent accidental updates after creation
    strict: true,
  }
);

// transactionId already has unique:true above.
// idempotencyKey already has sparse:true above.
// Additional indexes for query performance:
transactionSchema.index({ senderAccountId: 1 });
transactionSchema.index({ receiverAccountId: 1 });
transactionSchema.index({ createdAt: -1 });

const Transaction = mongoose.model('Transaction', transactionSchema);
module.exports = Transaction;
