/**
 * Integration Tests — Full Transfer Flow
 *
 * Tests the complete API flow end-to-end using Supertest:
 * Register → Login → Transfer → Verify Balances → Check History
 *
 * Uses mongodb-memory-server with replica set for full ACID support.
 */

const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryReplSet } = require('mongodb-memory-server');
const app = require('../app');

let mongoServer;

beforeAll(async () => {
  // Use replica set for full transaction support
  mongoServer = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
}, 60_000);

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
}, 30_000);

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

// Helper: register and get cookie
const registerAndLogin = async (userData) => {
  const res = await request(app).post('/api/v1/auth/register').send(userData);
  expect(res.status).toBe(201);
  const cookies = res.headers['set-cookie'];
  return { user: res.body.data.user, account: res.body.data.account, cookies };
};

describe('Integration — Full Banking Flow', () => {
  // ─── 1. Register creates account ─────────────────────────────────────────
  test('POST /register creates user and bank account', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({
      name: 'Alice',
      email: 'alice@test.com',
      password: 'password123',
    });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.account.accountNumber).toBeDefined();
    expect(res.body.data.account.balancePaise).toBe(1_000_000); // ₹10,000 demo balance
  });

  // ─── 2. Login flow ───────────────────────────────────────────────────────
  test('POST /login returns token in HTTP-only cookie', async () => {
    await request(app).post('/api/v1/auth/register').send({
      name: 'Bob', email: 'bob@test.com', password: 'password123',
    });

    const res = await request(app).post('/api/v1/auth/login').send({
      email: 'bob@test.com', password: 'password123',
    });

    expect(res.status).toBe(200);
    expect(res.headers['set-cookie']).toBeDefined();
    expect(res.headers['set-cookie'][0]).toMatch(/HttpOnly/i);
  });

  // ─── 3. Protected routes without auth ────────────────────────────────────
  test('GET /accounts/me without auth returns 401', async () => {
    const res = await request(app).get('/api/v1/accounts/me');
    expect(res.status).toBe(401);
    expect(res.body.code).toBe('UNAUTHORIZED');
  });

  // ─── 4. Core Transfer Flow ───────────────────────────────────────────────
  test('Complete transfer flow: deducts sender, credits receiver', async () => {
    const { cookies: aliceCookies, account: aliceAccount } = await registerAndLogin({
      name: 'Alice', email: 'alice2@test.com', password: 'password123',
    });
    const { account: bobAccount } = await registerAndLogin({
      name: 'Bob', email: 'bob2@test.com', password: 'password123',
    });

    // Transfer ₹300 from Alice to Bob
    const transferRes = await request(app)
      .post('/api/v1/transfers')
      .set('Cookie', aliceCookies)
      .send({
        receiverAccountNumber: bobAccount.accountNumber,
        amount: 300, // ₹300
        description: 'Dinner',
      });

    expect(transferRes.status).toBe(201);
    expect(transferRes.body.success).toBe(true);
    expect(transferRes.body.data.transactionId).toMatch(/^TXN/);
    expect(transferRes.body.data.amountRupees).toBe(300);

    // Verify Alice's balance decreased
    const aliceAccountRes = await request(app)
      .get('/api/v1/accounts/me')
      .set('Cookie', aliceCookies);
    expect(aliceAccountRes.body.data.account.balancePaise).toBe(970_000); // 1000000 - 30000
  });

  // ─── 5. Insufficient Balance ─────────────────────────────────────────────
  test('Transfer rejected when insufficient balance', async () => {
    const { cookies: aliceCookies } = await registerAndLogin({
      name: 'Alice', email: 'alice3@test.com', password: 'password123',
    });
    const { account: bobAccount } = await registerAndLogin({
      name: 'Bob', email: 'bob3@test.com', password: 'password123',
    });

    // Try to transfer more than balance (₹10,000 initial)
    const res = await request(app)
      .post('/api/v1/transfers')
      .set('Cookie', aliceCookies)
      .send({
        receiverAccountNumber: bobAccount.accountNumber,
        amount: 15000, // ₹15,000 > ₹10,000 balance
      });

    expect(res.status).toBe(422);
    expect(res.body.code).toBe('INSUFFICIENT_BALANCE');

    // Alice's balance unchanged
    const accountRes = await request(app).get('/api/v1/accounts/me').set('Cookie', aliceCookies);
    expect(accountRes.body.data.account.balancePaise).toBe(1_000_000);
  });

  // ─── 6. Transaction History ──────────────────────────────────────────────
  test('Transaction history shows sent and received', async () => {
    const { cookies: aliceCookies } = await registerAndLogin({
      name: 'Alice', email: 'alice4@test.com', password: 'password123',
    });
    const { cookies: bobCookies, account: bobAccount } = await registerAndLogin({
      name: 'Bob', email: 'bob4@test.com', password: 'password123',
    });

    // Alice → Bob ₹200
    await request(app)
      .post('/api/v1/transfers')
      .set('Cookie', aliceCookies)
      .send({ receiverAccountNumber: bobAccount.accountNumber, amount: 200 });

    // Check Alice's history (should show SENT)
    const aliceHistory = await request(app)
      .get('/api/v1/transactions')
      .set('Cookie', aliceCookies);

    expect(aliceHistory.body.data.transactions).toHaveLength(1);
    expect(aliceHistory.body.data.transactions[0].type).toBe('SENT');
    expect(aliceHistory.body.data.transactions[0].amountRupees).toBe(200);

    // Check Bob's history (should show RECEIVED)
    const bobHistory = await request(app)
      .get('/api/v1/transactions')
      .set('Cookie', bobCookies);

    expect(bobHistory.body.data.transactions).toHaveLength(1);
    expect(bobHistory.body.data.transactions[0].type).toBe('RECEIVED');
  });

  // ─── 7. Same Account Transfer ────────────────────────────────────────────
  test('Self-transfer rejected', async () => {
    const { cookies } = await registerAndLogin({
      name: 'Alice', email: 'alice5@test.com', password: 'password123',
    });

    const accountRes = await request(app).get('/api/v1/accounts/me').set('Cookie', cookies);
    const myAccountNumber = accountRes.body.data.account.accountNumber;

    const res = await request(app)
      .post('/api/v1/transfers')
      .set('Cookie', cookies)
      .send({ receiverAccountNumber: myAccountNumber, amount: 100 });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('SAME_ACCOUNT_TRANSFER');
  });

  // ─── 8. Pagination ───────────────────────────────────────────────────────
  test('Transaction history supports pagination', async () => {
    const { cookies: aliceCookies } = await registerAndLogin({
      name: 'Alice', email: 'alice6@test.com', password: 'password123',
    });
    const { account: bobAccount } = await registerAndLogin({
      name: 'Bob', email: 'bob6@test.com', password: 'password123',
    });

    // Make 3 transfers
    for (let i = 0; i < 3; i++) {
      await request(app)
        .post('/api/v1/transfers')
        .set('Cookie', aliceCookies)
        .send({ receiverAccountNumber: bobAccount.accountNumber, amount: 10 });
    }

    const page1 = await request(app)
      .get('/api/v1/transactions?page=1&limit=2')
      .set('Cookie', aliceCookies);

    expect(page1.body.data.transactions).toHaveLength(2);
    expect(page1.body.data.pagination.total).toBe(3);
    expect(page1.body.data.pagination.hasNextPage).toBe(true);
    expect(page1.body.data.pagination.totalPages).toBe(2);
  });

  // ─── 9. Idempotency ──────────────────────────────────────────────────────
  test('Duplicate transfer with same idempotency key only executes once (retry scenario)', async () => {
    const { cookies: aliceCookies } = await registerAndLogin({
      name: 'Alice', email: 'alice7@test.com', password: 'password123',
    });
    const { cookies: bobCookies, account: bobAccount } = await registerAndLogin({
      name: 'Bob', email: 'bob7@test.com', password: 'password123',
    });

    const key = 'unique-retry-key-xyz';
    const body = { receiverAccountNumber: bobAccount.accountNumber, amount: 100 };

    // First request — transfer executes
    const res1 = await request(app)
      .post('/api/v1/transfers')
      .set('Cookie', aliceCookies)
      .set('Idempotency-Key', key)
      .send(body);
    expect(res1.status).toBe(201);
    const txId1 = res1.body.data.transactionId;

    // Second request (network retry) — same key, should return cached result
    const res2 = await request(app)
      .post('/api/v1/transfers')
      .set('Cookie', aliceCookies)
      .set('Idempotency-Key', key)
      .send(body);
    expect(res2.status).toBe(201);
    const txId2 = res2.body.data.transactionId;

    // Same transaction ID returned — idempotent
    expect(txId1).toBe(txId2);

    // Bob's balance increased by only ₹100 (not ₹200)
    const bobAccount2 = await request(app).get('/api/v1/accounts/me').set('Cookie', bobCookies);
    expect(bobAccount2.body.data.account.balancePaise).toBe(1_010_000); // 1000000 + 10000

    // Only one transaction record exists for this key
    const Transaction = require('../models/Transaction');
    const count = await Transaction.countDocuments({ idempotencyKey: key });
    expect(count).toBe(1);
  });
});
