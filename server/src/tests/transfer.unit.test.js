/**
 * Unit Tests — Transfer Service
 *
 * Tests the core business logic of the transfer service in isolation.
 * Uses MongoMemoryReplSet for replica-set support (required for ACID transactions).
 */

const mongoose = require('mongoose');
const { MongoMemoryReplSet } = require('mongodb-memory-server');
const Account = require('../models/Account');
const User = require('../models/User');
const Transaction = require('../models/Transaction');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
}, 60_000);

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
}, 30_000);

afterEach(async () => {
  await User.deleteMany({});
  await Account.deleteMany({});
  await Transaction.deleteMany({});
});

// bcrypt hash of 'testpassword' — pre-computed to avoid re-hashing in tests
const HASHED_PW = '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeHLMEq.i5P5jUiKu';

// Helper to create a user + account directly in DB (bypassing pre-save hook)
const createUserWithAccount = async (email, balancePaise = 100_000) => {
  // Insert user directly to bypass the bcrypt pre-save hook in tests
  const user = new User({ name: 'Test User', email, passwordHash: HASHED_PW });
  user.$locals.skipHash = true; // signal to pre-save not to re-hash
  await user.save();

  const account = await Account.create({
    accountNumber: `10${Math.floor(Math.random() * 100_000_000).toString().padStart(8, '0')}`,
    userId: user._id,
    balancePaise,
    currency: 'INR',
    status: 'ACTIVE',
  });
  return { user, account };
};

describe('Transfer Service — Unit Tests', () => {
  const { executeTransfer } = require('../services/transferService');

  // ─── 1. Valid Transfer ───────────────────────────────────────────────────
  test('✅ Valid transfer: deducts sender, credits receiver, creates record', async () => {
    const { user: senderUser, account: senderAccount } = await createUserWithAccount('sender@test.com', 100_000); // ₹1000
    const { account: receiverAccount } = await createUserWithAccount('receiver@test.com', 50_000); // ₹500

    const tx = await executeTransfer(
      senderUser._id,
      receiverAccount.accountNumber,
      300, // ₹300
      'Test transfer'
    );

    expect(tx.status).toBe('SUCCESS');
    expect(tx.amountPaise).toBe(30_000); // ₹300 = 30000 paise

    // Verify balances
    const updatedSender = await Account.findById(senderAccount._id);
    const updatedReceiver = await Account.findById(receiverAccount._id);
    expect(updatedSender.balancePaise).toBe(70_000);  // 100000 - 30000
    expect(updatedReceiver.balancePaise).toBe(80_000); // 50000 + 30000
  });

  // ─── 2. Insufficient Balance ────────────────────────────────────────────
  test('❌ Insufficient balance: rejects and does not modify any balances', async () => {
    const { user: senderUser, account: senderAccount } = await createUserWithAccount('sender2@test.com', 50_000); // ₹500
    const { account: receiverAccount } = await createUserWithAccount('receiver2@test.com', 0);

    await expect(
      executeTransfer(senderUser._id, receiverAccount.accountNumber, 1500) // ₹1500 > ₹500
    ).rejects.toMatchObject({ code: 'INSUFFICIENT_BALANCE' });

    // Balances must be unchanged
    const sender = await Account.findById(senderAccount._id);
    const receiver = await Account.findById(receiverAccount._id);
    expect(sender.balancePaise).toBe(50_000);
    expect(receiver.balancePaise).toBe(0);
  });

  // ─── 3. Zero amount ─────────────────────────────────────────────────────
  test('❌ Zero amount: rejected', async () => {
    const { user: senderUser } = await createUserWithAccount('sender3@test.com', 100_000);
    const { account: receiverAccount } = await createUserWithAccount('receiver3@test.com', 0);

    await expect(
      executeTransfer(senderUser._id, receiverAccount.accountNumber, 0)
    ).rejects.toMatchObject({ code: 'INVALID_AMOUNT' });
  });

  // ─── 4. Negative amount ─────────────────────────────────────────────────
  test('❌ Negative amount: rejected', async () => {
    const { user: senderUser } = await createUserWithAccount('sender4@test.com', 100_000);
    const { account: receiverAccount } = await createUserWithAccount('receiver4@test.com', 0);

    await expect(
      executeTransfer(senderUser._id, receiverAccount.accountNumber, -500)
    ).rejects.toMatchObject({ code: 'INVALID_AMOUNT' });
  });

  // ─── 5. Same account transfer ───────────────────────────────────────────
  test('❌ Same account transfer: rejected', async () => {
    const { user: senderUser, account: senderAccount } = await createUserWithAccount('sender5@test.com', 100_000);

    await expect(
      executeTransfer(senderUser._id, senderAccount.accountNumber, 100)
    ).rejects.toMatchObject({ code: 'SAME_ACCOUNT_TRANSFER' });
  });

  // ─── 6. Non-existent recipient ──────────────────────────────────────────
  test('❌ Non-existent recipient: rejected', async () => {
    const { user: senderUser } = await createUserWithAccount('sender6@test.com', 100_000);

    await expect(
      executeTransfer(senderUser._id, '9999999999', 100) // non-existent account
    ).rejects.toMatchObject({ code: 'ACCOUNT_NOT_FOUND' });
  });

  // ─── 7. Frozen sender account ───────────────────────────────────────────
  test('❌ Frozen sender account: rejected', async () => {
    const { user: senderUser } = await createUserWithAccount('sender7@test.com', 100_000);
    const { account: receiverAccount } = await createUserWithAccount('receiver7@test.com', 0);

    // Freeze sender account
    await Account.findOneAndUpdate({ userId: senderUser._id }, { status: 'FROZEN' });

    await expect(
      executeTransfer(senderUser._id, receiverAccount.accountNumber, 100)
    ).rejects.toMatchObject({ code: 'ACCOUNT_FROZEN' });
  });

  // ─── 8. Frozen receiver account ─────────────────────────────────────────
  test('❌ Frozen receiver account: rejected', async () => {
    const { user: senderUser } = await createUserWithAccount('sender8@test.com', 100_000);
    const { account: receiverAccount } = await createUserWithAccount('receiver8@test.com', 0);

    await Account.findByIdAndUpdate(receiverAccount._id, { status: 'FROZEN' });

    await expect(
      executeTransfer(senderUser._id, receiverAccount.accountNumber, 100)
    ).rejects.toMatchObject({ code: 'ACCOUNT_FROZEN' });
  });

  // ─── 9. Idempotency ─────────────────────────────────────────────────────
  test('✅ Idempotency: same key returns cached result without re-executing', async () => {
    const { user: senderUser } = await createUserWithAccount('sender9@test.com', 100_000);
    const { account: receiverAccount } = await createUserWithAccount('receiver9@test.com', 0);

    const key = 'test-idempotency-key-123';
    const tx1 = await executeTransfer(senderUser._id, receiverAccount.accountNumber, 100, 'First', key);
    const tx2 = await executeTransfer(senderUser._id, receiverAccount.accountNumber, 100, 'Duplicate', key);

    // Same transaction returned
    expect(tx1.transactionId).toBe(tx2.transactionId);

    // Balance only changed once
    const receiver = await Account.findById(receiverAccount._id);
    expect(receiver.balancePaise).toBe(10_000); // Only ₹100 = 10000 paise added once
  });
});
