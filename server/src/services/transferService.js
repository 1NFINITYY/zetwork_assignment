const mongoose = require('mongoose');
const Account = require('../models/Account');
const Transaction = require('../models/Transaction');
const AppError = require('../utils/AppError');
const generateTransactionId = require('../utils/generateTransactionId');
const { rupeesToPaise } = require('../utils/moneyUtils');

/**
 * Transfer Service — The core banking logic.
 *
 * ACID Implementation (spec section 7):
 * ─────────────────────────────────────
 * All DB operations (debit sender, credit receiver, create transaction record)
 * are wrapped in a single MongoDB session transaction via session.withTransaction().
 *
 * If ANY step fails, the entire transaction is rolled back automatically.
 * The server crash scenario (debit without credit) is prevented by atomicity.
 *
 * Concurrency Safety (spec section 8):
 * ─────────────────────────────────────
 * MongoDB's document-level locking within a session, combined with the
 * balance re-check inside the transaction, prevents the double-spend scenario.
 * We use findOneAndUpdate with $inc and a balance guard ($gte: amountPaise)
 * so that two concurrent ₹800 transfers from a ₹1,000 account cannot both succeed.
 *
 * Idempotency (spec section 19):
 * ─────────────────────────────────────
 * If an idempotencyKey is provided, we check for an existing transaction
 * with that key before proceeding. If found, return the cached result.
 * The unique sparse index on idempotencyKey prevents duplicates.
 *
 * Money representation:
 * ─────────────────────────────────────
 * Amount from API is in RUPEES (float). We convert to PAISE (integer)
 * before any arithmetic. All DB values are paise.
 */

/**
 * Execute a money transfer atomically.
 *
 * @param {string} senderUserId   - ObjectId of the logged-in user
 * @param {string} receiverAccountNumber - Account number of recipient
 * @param {number} amountRupees   - Transfer amount in rupees (from API)
 * @param {string} description    - Optional description
 * @param {string|null} idempotencyKey - Optional idempotency key from header
 * @returns {Transaction}         - The created transaction record
 */
const executeTransfer = async (
  senderUserId,
  receiverAccountNumber,
  amountRupees,
  description = '',
  idempotencyKey = null
) => {
  // --- Step 1: Validate amount (pre-transaction validation) ---
  if (typeof amountRupees !== 'number' || !isFinite(amountRupees) || amountRupees <= 0) {
    throw new AppError('Invalid transfer amount', 400, 'INVALID_AMOUNT');
  }

  const amountPaise = rupeesToPaise(amountRupees);
  if (amountPaise < 1) {
    throw new AppError('Amount must be at least ₹0.01', 400, 'INVALID_AMOUNT');
  }

  // --- Step 2: Idempotency check ---
  if (idempotencyKey) {
    const existingTx = await Transaction.findOne({ idempotencyKey });
    if (existingTx) {
      // Already processed — return cached result without re-executing
      return existingTx;
    }
  }

  // --- Step 3: Pre-fetch accounts (outside transaction for early validation) ---
  const senderAccount = await Account.findOne({ userId: senderUserId });
  if (!senderAccount) {
    throw new AppError('Sender account not found', 404, 'ACCOUNT_NOT_FOUND');
  }

  const receiverAccount = await Account.findOne({ accountNumber: receiverAccountNumber });
  if (!receiverAccount) {
    throw new AppError('Recipient account not found', 404, 'ACCOUNT_NOT_FOUND');
  }

  // --- Step 4: Same-account check ---
  if (senderAccount._id.equals(receiverAccount._id)) {
    throw new AppError('Cannot transfer to the same account', 400, 'SAME_ACCOUNT_TRANSFER');
  }

  // --- Step 5: Account status checks ---
  if (senderAccount.status === 'FROZEN') {
    throw new AppError('Your account is frozen', 403, 'ACCOUNT_FROZEN');
  }
  if (senderAccount.status === 'CLOSED') {
    throw new AppError('Your account is closed', 403, 'ACCOUNT_CLOSED');
  }
  if (receiverAccount.status === 'FROZEN') {
    throw new AppError('Recipient account is frozen', 403, 'ACCOUNT_FROZEN');
  }
  if (receiverAccount.status === 'CLOSED') {
    throw new AppError('Recipient account is closed', 403, 'ACCOUNT_CLOSED');
  }
  if (senderAccount.status !== 'ACTIVE') {
    throw new AppError('Sender account is not active', 403, 'ACCOUNT_FROZEN');
  }
  if (receiverAccount.status !== 'ACTIVE') {
    throw new AppError('Recipient account is not active', 403, 'ACCOUNT_FROZEN');
  }

  // --- Step 6: START MONGODB TRANSACTION ---
  const session = await mongoose.startSession();
  let transaction;

  try {
    await session.withTransaction(async () => {
      // Re-fetch sender inside transaction with session for isolation
      // Use findOneAndUpdate with balance guard — this is the concurrency-safe check.
      // The $gte condition ensures we only debit if balance is sufficient.
      // This is an atomic check-and-debit in a single DB operation.
      const updatedSender = await Account.findOneAndUpdate(
        {
          _id: senderAccount._id,
          status: 'ACTIVE',
          balancePaise: { $gte: amountPaise }, // Concurrency-safe balance guard
        },
        {
          $inc: { balancePaise: -amountPaise },
        },
        {
          new: true,
          session,
          runValidators: true,
        }
      );

      // If updatedSender is null, either balance was insufficient (race condition caught)
      // or account status changed mid-flight
      if (!updatedSender) {
        // Re-check to determine the actual reason for failure
        const freshSender = await Account.findById(senderAccount._id).session(session);
        if (!freshSender || freshSender.balancePaise < amountPaise) {
          throw new AppError('Insufficient balance', 422, 'INSUFFICIENT_BALANCE');
        }
        throw new AppError('Transfer failed due to account status change', 422, 'ACCOUNT_FROZEN');
      }

      // Credit receiver — atomic $inc
      await Account.findOneAndUpdate(
        { _id: receiverAccount._id, status: 'ACTIVE' },
        { $inc: { balancePaise: amountPaise } },
        { session, runValidators: true }
      );

      // Create immutable transaction record
      const transactionId = generateTransactionId();
      const [createdTx] = await Transaction.create(
        [
          {
            transactionId,
            senderAccountId: senderAccount._id,
            receiverAccountId: receiverAccount._id,
            amountPaise,
            currency: 'INR',
            status: 'SUCCESS',
            description,
            idempotencyKey: idempotencyKey || null,
          },
        ],
        { session }
      );

      transaction = createdTx;
    });

    return transaction;
  } catch (err) {
    // If it's our AppError, rethrow as-is
    if (err.isOperational) throw err;

    // MongoDB duplicate key on idempotencyKey — concurrent request with same key
    if (err.code === 11000 && err.keyPattern?.idempotencyKey) {
      const existingTx = await Transaction.findOne({ idempotencyKey });
      if (existingTx) return existingTx;
    }

    throw new AppError('Transfer failed due to an internal error', 500, 'TRANSFER_FAILED');
  } finally {
    await session.endSession();
  }
};

module.exports = { executeTransfer };
