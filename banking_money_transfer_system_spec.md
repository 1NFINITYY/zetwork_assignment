# Banking Money Transfer System — Complete Project Specification

## 1. Project Overview

Build a small full-stack banking application where users can create bank accounts, view balances, transfer money between accounts, and view transaction history.

The assignment's required scope is:

- Create user bank accounts with balance
- View account balance and transaction history
- Transfer money between accounts
- Prevent transfers exceeding available balance
- Show updated transaction history after every transfer

### Explicitly Out of Scope

- Actual payment gateway integrations
- Razorpay / Stripe
- UPI
- Credit/debit card processing
- Real bank integrations

The application should simulate money transfers internally.

---

# 2. Recommended Tech Stack

### Frontend
- React
- Vite
- Tailwind CSS
- React Router
- Axios

### Backend
- Node.js
- Express.js
- MongoDB
- Mongoose

### Authentication
- JWT
- HTTP-only cookies
- bcrypt or Argon2

### Validation & Security
- Zod / Joi / express-validator
- Helmet
- CORS
- Rate limiting

### Deployment
- Frontend: Vercel
- Backend: Render / Railway
- Database: MongoDB Atlas

---

# 3. Core Functional Requirements

## A. User Registration

Allow users to create an account with:

- Name
- Email
- Password

Passwords must never be stored in plaintext.

---

## B. Login / Logout

Implement:

- Login
- Logout
- Protected routes
- Current-user endpoint

Example:

```text
POST /api/v1/auth/register
POST /api/v1/auth/login
POST /api/v1/auth/logout
GET  /api/v1/auth/me
```

---

# 4. Bank Account

Each user should have a bank account.

Suggested fields:

```js
{
  accountNumber,
  userId,
  balance,
  currency,
  status,
  createdAt,
  updatedAt
}
```

Example:

```text
Account Number: 1000123456
Balance: ₹15,000
Currency: INR
Status: ACTIVE
```

Possible statuses:

```text
ACTIVE
FROZEN
CLOSED
```

Only ACTIVE accounts should be able to perform transfers.

---

# 5. Money Transfer

This is the most important part of the application.

Example:

```text
Sender:
Account: 10001
Balance: ₹10,000

Receiver:
Account: 10002
Balance: ₹5,000

Transfer: ₹2,000
```

After the transfer:

```text
Sender:    ₹8,000
Receiver: ₹7,000
```

A transaction record must also be created.

---

# 6. Transfer Validation

The backend must validate every transfer.

### Invalid amount

Reject:

```text
₹0
Negative values
Invalid/non-numeric values
```

### Insufficient balance

```text
Balance = ₹1,000
Transfer = ₹1,500
```

Result:

```text
Transfer rejected
Reason: Insufficient balance
```

### Same account

Sender and receiver cannot be the same account.

### Invalid recipient

Reject transfers when the recipient account doesn't exist.

### Inactive accounts

Transfers should fail if the sender or receiver account is frozen/closed.

---

# 7. ACID / Database Transactions

This is one of the most important production-grade aspects.

A money transfer must be atomic.

Bad scenario:

```text
Deduct sender
       ↓
Server crashes
       ↓
Receiver never gets money
```

Correct flow:

```text
START TRANSACTION

1. Validate sender
2. Validate receiver
3. Check balance
4. Debit sender
5. Credit receiver
6. Create transaction record
7. COMMIT

If anything fails:
ROLLBACK EVERYTHING
```

### ACID Principles

**Atomicity**
- Either the complete transfer succeeds or nothing changes.

**Consistency**
- Database remains in a valid state.

**Isolation**
- Concurrent transfers must not corrupt balances.

**Durability**
- Once committed, the transfer remains persisted.

### MongoDB

Use MongoDB sessions/transactions:

```js
session.withTransaction(...)
```

Do not implement the transfer as unrelated database writes.

---

# 8. Concurrency Safety

Consider:

```text
Balance = ₹1,000
```

Two simultaneous requests:

```text
Request A → Transfer ₹800
Request B → Transfer ₹800
```

Both must NOT be allowed to spend the same ₹1,000.

The transfer implementation must be concurrency-safe using appropriate database transactions/atomic operations.

This is an important distinction between a simple CRUD application and a financial-style system.

---

# 9. Money Representation

Avoid floating-point calculations for monetary values.

Prefer storing money in the smallest currency unit.

Example:

```text
₹100.50 = 10050 paise
```

Then calculations use integers.

Alternatively, use the database's appropriate decimal type.

Document the chosen approach in the README.

---

# 10. Transaction / Ledger Model

Suggested transaction structure:

```js
{
  transactionId,
  senderAccountId,
  receiverAccountId,
  amount,
  currency,
  type,
  status,
  description,
  createdAt
}
```

Example:

```text
Transaction ID: TXN123456
From: 10001
To: 10002
Amount: ₹2,000
Status: SUCCESS
```

Possible statuses:

```text
SUCCESS
FAILED
```

Transaction records should be effectively immutable after creation.

---

# 11. Transaction History

The user must be able to see transaction history.

Display:

- Transaction ID
- Sent / Received
- Amount
- Other account
- Status
- Date/time
- Description

Example:

```text
------------------------------------------------
ID       Type       Amount      Status    Date
------------------------------------------------
TX001    SENT       ₹2,000      SUCCESS   Today
TX002    RECEIVED   ₹500        SUCCESS   Yesterday
TX003    SENT       ₹1,000      FAILED    Yesterday
------------------------------------------------
```

Implement pagination:

```http
GET /api/v1/transactions?page=1&limit=20
```

---

# 12. Dashboard

Create a clean banking dashboard.

Recommended sections:

```text
Welcome, User

Available Balance
₹24,580.00

Account Number
1000123456

[ Send Money ]

Recent Transactions
----------------------------
₹2,000   Received   SUCCESS
₹500     Sent       SUCCESS
₹1,000   Sent       FAILED
```

---

# 13. Transfer Screen

Recommended UI:

```text
Send Money

Recipient Account Number
[________________]

Amount
[________________]

Description
[________________]

[ Transfer Money ]
```

Before executing the transfer:

```text
Are you sure?

Send ₹2,000 to
Account ending 3456

[Cancel] [Confirm Transfer]
```

---

# 14. API Design

Use versioned REST APIs.

```text
/api/v1/auth
/api/v1/accounts
/api/v1/transfers
/api/v1/transactions
```

## Authentication

```http
POST /api/v1/auth/register
POST /api/v1/auth/login
POST /api/v1/auth/logout
GET  /api/v1/auth/me
```

## Accounts

```http
POST /api/v1/accounts
GET  /api/v1/accounts/me
GET  /api/v1/accounts/:accountNumber
```

## Transfers

```http
POST /api/v1/transfers
```

Example request:

```json
{
  "receiverAccountNumber": "1000234567",
  "amount": 2000,
  "description": "Dinner"
}
```

## Transactions

```http
GET /api/v1/transactions
GET /api/v1/transactions/:transactionId
```

---

# 15. Consistent API Responses

Use a consistent response structure.

### Success

```json
{
  "success": true,
  "message": "Transfer successful",
  "data": {
    "transactionId": "TXN123"
  }
}
```

### Error

```json
{
  "success": false,
  "message": "Insufficient balance",
  "code": "INSUFFICIENT_BALANCE"
}
```

Useful error codes:

```text
INVALID_AMOUNT
ACCOUNT_NOT_FOUND
SAME_ACCOUNT_TRANSFER
INSUFFICIENT_BALANCE
UNAUTHORIZED
ACCOUNT_FROZEN
ACCOUNT_CLOSED
VALIDATION_ERROR
```

---

# 16. Error Handling

Use centralized error handling.

Recommended HTTP statuses:

```text
400 Bad Request
401 Unauthorized
403 Forbidden
404 Not Found
409 Conflict
429 Too Many Requests
500 Internal Server Error
```

Create:

```text
middleware/
    errorHandler.js
```

Don't duplicate error-handling logic throughout every controller.

---

# 17. Security

## Password Security

Use:

```text
bcrypt
```

or:

```text
Argon2
```

Never store plaintext passwords.

## Authentication

Use JWT with secure HTTP-only cookies.

## Input Validation

Validate all incoming data on the backend.

Use:

```text
Zod
Joi
express-validator
```

## Helmet

Use Helmet to add common HTTP security headers.

## CORS

Allow only the required frontend origin(s).

Do not use unrestricted:

```text
Access-Control-Allow-Origin: *
```

when credentials are involved.

---

# 18. Rate Limiting

Add **rate limiting** to protect the APIs from abuse.

Especially protect:

```text
/login
/register
/transfers
```

Example policy:

```text
Authentication:
limited requests per IP over a short window

Transfer API:
stricter limit to prevent repeated transfer attempts
```

Return:

```text
429 Too Many Requests
```

when the limit is exceeded.

Use an established Express rate-limiting middleware rather than implementing your own from scratch.

For production deployment, consider a shared store if the backend runs across multiple instances.

---

# 19. Idempotency

Optional but highly recommended for the transfer endpoint.

Problem:

```text
User clicks Transfer
       ↓
Transfer succeeds
       ↓
Network request times out
       ↓
Frontend retries
```

Without idempotency:

```text
₹500 transferred twice
```

With an idempotency key:

```text
Idempotency-Key: abc123
```

The backend recognizes that the request was already processed and does not execute the transfer again.

This is a strong real-world financial-system concept.

---

# 20. Database Indexes

Add indexes to frequently queried/unique fields.

Recommended:

```text
users.email → unique
accounts.accountNumber → unique
transactions.transactionId → unique
transactions.senderAccountId
transactions.receiverAccountId
transactions.createdAt
```

This improves query performance and enforces important uniqueness constraints.

---

# 21. Backend Architecture

Keep business logic separated from HTTP logic.

Recommended flow:

```text
Route
  ↓
Controller
  ↓
Service
  ↓
Database
```

Example:

```text
transferController.js
        ↓
transferService.js
        ↓
MongoDB transaction
```

Do NOT put all banking logic directly inside Express routes.

---

# 22. Recommended Project Structure

```text
banking-system/
│
├── client/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── context/
│   │   ├── utils/
│   │   └── App.jsx
│   │
│   └── package.json
│
├── server/
│   ├── src/
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── models/
│   │   ├── services/
│   │   ├── middleware/
│   │   ├── validators/
│   │   ├── utils/
│   │   ├── config/
│   │   └── app.js
│   │
│   └── package.json
│
├── tests/
│
├── .env.example
├── .gitignore
├── README.md
└── package.json
```

---

# 23. Frontend Pages

Keep the frontend focused.

```text
/
├── Login
├── Register
│
└── Dashboard
    ├── Account Overview
    ├── Send Money
    ├── Transactions
    └── Profile
```

---

# 24. UX Requirements

Handle all important UI states.

### Loading

```text
Loading transactions...
```

### Empty

```text
No transactions yet.
```

### Error

```text
Unable to load transactions.
[Retry]
```

### Successful transfer

```text
✓ Transfer successful

Transaction ID:
TXN123456
```

### Failed transfer

```text
✕ Transfer failed

Insufficient balance
```

---

# 25. Testing

Add tests for the most important business logic.

## Unit Tests

Test:

```text
Valid transfer
Insufficient balance
Invalid amount
Same-account transfer
Invalid recipient
Frozen account
```

## Integration Test

Test the complete flow:

```text
Create accounts
      ↓
Transfer money
      ↓
Check sender balance
      ↓
Check receiver balance
      ↓
Check transaction history
```

Important test:

```text
Initial:
A = ₹1000
B = ₹500

Transfer:
₹300

Expected:
A = ₹700
B = ₹800
```

Insufficient balance:

```text
A = ₹1000

Transfer ₹1500

Expected:
Transfer rejected
A = ₹1000
B unchanged
```

Also test concurrent transfer behavior if practical.

---

# 26. Deployment

The assignment requires a fully functional deployed application. fileciteturn0file0L16-L20

Recommended:

```text
Frontend → Vercel
Backend  → Render / Railway
Database → MongoDB Atlas
```

Environment variables:

```text
MONGO_URI=
JWT_SECRET=
CLIENT_URL=
```

Never commit:

```text
.env
```

Commit:

```text
.env.example
```

---

# 27. README Requirements

The README should contain:

```text
# Banking Money Transfer System

## Overview

## Features

## Tech Stack

## Architecture

## Database Schema

## API Documentation

## Authentication

## Transfer Flow

## ACID / Transaction Handling

## Concurrency Handling

## Security

## Rate Limiting

## Idempotency

## Testing

## Environment Variables

## Local Setup

## Deployment

## Sample Test Flow

## Live Demo

## GitHub Repository
```

The assignment specifically requires setup instructions and a sample usage/test flow. fileciteturn0file0L17-L19

---

# 28. What NOT to Build

Because the deadline is **24 hours**, avoid unnecessary complexity. fileciteturn0file0L19-L20

Do NOT spend time building:

```text
❌ Razorpay
❌ Stripe
❌ UPI
❌ Credit/debit card processing
❌ OTP infrastructure
❌ KYC
❌ Loans
❌ Investments
❌ Real banking integrations
❌ Microservices
❌ Kafka
❌ Kubernetes
❌ Blockchain
```

The goal is a well-engineered small banking system, not a complete bank.

---

# 29. Feature Priority

| Feature | Priority |
|---|---:|
| Account creation | ⭐⭐⭐⭐⭐ |
| Balance | ⭐⭐⭐⭐⭐ |
| Money transfer | ⭐⭐⭐⭐⭐ |
| Transaction history | ⭐⭐⭐⭐⭐ |
| Insufficient balance | ⭐⭐⭐⭐⭐ |
| Database transactions / ACID | ⭐⭐⭐⭐⭐ |
| Concurrency safety | ⭐⭐⭐⭐⭐ |
| Authentication | ⭐⭐⭐⭐ |
| Validation | ⭐⭐⭐⭐⭐ |
| Error handling | ⭐⭐⭐⭐⭐ |
| Rate limiting | ⭐⭐⭐⭐ |
| Security | ⭐⭐⭐⭐⭐ |
| Transaction ledger | ⭐⭐⭐⭐⭐ |
| Tests | ⭐⭐⭐⭐ |
| Pagination | ⭐⭐⭐ |
| Idempotency | ⭐⭐⭐⭐ |
| Fancy animations | ⭐ |

**Engineering quality should take priority over flashy features.**

---

# 30. Ideal Transfer Flow

This is the core implementation to get right:

```text
POST /api/v1/transfers
          ↓
Authenticate user
          ↓
Validate request
          ↓
Validate amount
          ↓
Find sender
          ↓
Find receiver
          ↓
Check account status
          ↓
Check sender != receiver
          ↓
Start DB transaction
          ↓
Verify available balance
          ↓
Debit sender
          ↓
Credit receiver
          ↓
Create transaction/ledger record
          ↓
Commit transaction
          ↓
Return transaction ID
```

If anything fails:

```text
ROLLBACK
    ↓
No balance changes
    ↓
No inconsistent transaction state
    ↓
Return appropriate error
```

---

# 31. Target Architecture

```text
                    ┌──────────────┐
                    │   React UI   │
                    └──────┬───────┘
                           │
                           ▼
                    ┌──────────────┐
                    │ REST API     │
                    │ Express      │
                    └──────┬───────┘
                           │
              Authentication / Validation
                    Rate Limiting
                           │
                           ▼
                    ┌──────────────┐
                    │ Controllers  │
                    └──────┬───────┘
                           │
                           ▼
                    ┌──────────────┐
                    │  Services    │
                    │              │
                    │ Transfer     │
                    │ Service      │
                    └──────┬───────┘
                           │
                    DB Transaction
                           │
                           ▼
                    ┌──────────────┐
                    │  MongoDB     │
                    │              │
                    │ Users        │
                    │ Accounts     │
                    │ Transactions │
                    └──────────────┘
```

---

# 32. Final Scope

The final application should be a:

**Secure, transactional, full-stack banking money-transfer simulation.**

### Must have

- User registration/login
- Bank account creation
- Account number
- Balance
- Money transfer
- Insufficient balance protection
- Transaction history
- Proper validation
- Error handling
- Database transactions / ACID
- Concurrency-safe transfer logic
- Secure password storage
- JWT authentication
- Rate limiting
- Database indexes
- Pagination
- Tests
- Deployment
- Professional README

### Strong bonus features

- Idempotency
- Immutable ledger
- Transfer confirmation
- Transaction details
- Excellent loading/error states
- API documentation

### Don't build

- Real payment gateway
- UPI
- Real bank integration
- Other banking products

---

# 33. 24-Hour Implementation Strategy

## Phase 1 — Backend Foundation

```text
Project setup
Database
User model
Account model
Transaction model
Authentication
```

## Phase 2 — Core Banking Logic

```text
Account creation
Balance retrieval
Transfer service
MongoDB transaction
Insufficient balance
Concurrency handling
Transaction history
```

## Phase 3 — Security

```text
Validation
JWT security
HTTP-only cookies
Helmet
CORS
Rate limiting
Error handling
```

## Phase 4 — Frontend

```text
Login
Register
Dashboard
Balance
Send money
Transaction history
Loading/error states
```

## Phase 5 — Testing

```text
Transfer tests
Insufficient balance
Invalid recipient
Same account
Authentication
Integration flow
```

## Phase 6 — Deployment

```text
MongoDB Atlas
Backend deployment
Frontend deployment
Environment variables
Production testing
```

## Phase 7 — Final Polish

```text
README
API documentation
UI polish
Responsive design
Demo/test accounts
GitHub cleanup
```

---

## The main principle

**Don't try to make it huge. Make the small scope technically correct.**

A reviewer should be able to look at your project and think:

> "The feature set is simple, but the candidate understands transactions, consistency, security, validation, concurrency, and production API design."

That is the sweet spot for this assignment.
