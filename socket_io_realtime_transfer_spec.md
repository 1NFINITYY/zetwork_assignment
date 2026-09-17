# Real-Time Money Transfer — Socket.IO Implementation Plan

## Goal

When User A successfully transfers money to User B:

1. Atomically update both balances.
2. Create the transaction record(s).
3. Commit the MongoDB transaction.
4. Only after commit, emit a Socket.IO event.
5. User B immediately receives a notification.
6. User B's balance and transaction history refresh without a manual page refresh.

**Do not add a real payment gateway.** This is only for the internal simulated banking system.

---

## 1. Critical Architecture Rule

**MongoDB is the source of truth. Socket.IO is only for real-time notification/UI synchronization.**

Correct:

```text
Transfer API
    ↓
Validate
    ↓
MongoDB Transaction
    ├── Debit sender
    ├── Credit receiver
    └── Create transaction
    ↓
COMMIT
    ↓
Socket.IO event
    ↓
Recipient UI updates
```

Never make Socket.IO responsible for moving money.

---

## 2. Transfer Flow

Example:

```text
Anant sends ₹500 to Rahul
        ↓
POST /api/v1/transfers
        ↓
Validate transfer
        ↓
MongoDB transaction
        ├── Anant: -₹500
        ├── Rahul: +₹500
        └── Create transaction
        ↓
COMMIT
        ↓
Emit "money_received"
        ↓
Rahul's browser receives event
        ↓
Show notification
        ↓
Refetch balance + transactions
```

---

## 3. Socket.IO Backend

Attach Socket.IO to the existing HTTP server.

```text
Express App
    ↓
HTTP Server
    ↓
Socket.IO
```

Do not create an unnecessary separate server.

---

## 4. Socket Authentication

Authenticate Socket.IO connections.

Flow:

```text
Client connects
    ↓
Verify JWT/session
    ↓
Identify authenticated user
    ↓
Join that user's private room
```

Use a room such as:

```text
user:<userId>
```

The server must decide which room the authenticated user is allowed to join.

Do not allow a client to subscribe to another user's room by simply supplying an ID.

---

## 5. User-Specific Rooms

Example:

```text
Rahul userId = 123

Room:
user:123
```

When Anant transfers money to Rahul:

```js
io.to("user:123").emit("money_received", payload);
```

If Rahul has multiple authenticated tabs/devices, all of his connections can receive the event.

---

## 6. Event Payload

Use:

```text
money_received
```

Example payload:

```json
{
  "type": "MONEY_RECEIVED",
  "transactionId": "TXN_8F92K1",
  "sender": {
    "name": "Anant Jain",
    "accountNumberMasked": "••••6060"
  },
  "amount": 50000,
  "currency": "INR",
  "description": "Dinner",
  "receivedAt": "2026-09-18T00:48:00.000Z"
}
```

If the database stores paise:

```text
50000 = ₹500.00
```

Keep the representation consistent across the application.

---

## 7. Do Not Expose Sensitive Information

Never send through Socket.IO:

```text
❌ Password
❌ JWT/token
❌ Full account number
❌ Database credentials
❌ Unnecessary sensitive personal data
```

Use:

```text
••••6060
```

instead of a full account number.

---

## 8. Money Received Notification

Show an immediate toast/notification:

```text
💰 Money Received

Anant Jain sent you ₹500.00
Account: ••••6060
Transaction: TXN_8F92K1

Your new balance: ₹2,500.00
```

Short toast version:

```text
💰 ₹500 received from Anant Jain
```

---

## 9. Notification Details

The notification can include:

- Sender name
- Masked sender account number
- Amount
- Currency
- Transaction ID
- Description
- Timestamp
- New balance

**Important:** Do not blindly trust a balance included in a socket event. Refetch the authoritative balance from the backend.

---

## 10. Update Recipient State

When the recipient receives `money_received`:

```text
1. Show notification
2. Fetch current account balance
3. Fetch recent transactions
4. Update UI
```

Conceptually:

```js
socket.on("money_received", async (event) => {
    showMoneyReceivedToast(event);

    await Promise.all([
        fetchAccountBalance(),
        fetchTransactions()
    ]);
});
```

Do not simply do:

```js
balance += amount;
```

The backend/database remains authoritative.

---

## 11. Transaction History

After receiving money, Rahul should immediately see:

```text
+ ₹500.00
Received from Anant Jain
SUCCESS
TXN_8F92K1
Today, 12:48 AM
```

The sender should see:

```text
- ₹500.00
Sent to Rahul
SUCCESS
TXN_8F92K1
Today, 12:48 AM
```

Both sides should reference the appropriate transaction ID.

---

## 12. Sender UI

After the transfer API succeeds, update the sender's UI immediately.

Example:

```text
✓ Transfer Successful

₹500.00 sent successfully

Transaction ID:
TXN_8F92K1

Balance:
₹4,500.00
```

The sender can update from the REST API response/refetch. Socket.IO does not need to be the mechanism for the sender's own update.

---

## 13. Database Commit Before Socket Event

This is mandatory.

Incorrect:

```text
Emit socket event
    ↓
Update database
    ↓
Database fails
```

Correct:

```text
MongoDB transaction
    ↓
Debit sender
    ↓
Credit receiver
    ↓
Create transaction
    ↓
COMMIT
    ↓
Emit money_received
```

The recipient must never receive a successful money-received event for a failed transfer.

---

## 14. Failed Transfer

Example:

```text
Sender balance = ₹1,000
Transfer = ₹1,500
```

Expected:

```text
Transfer rejected
Sender remains ₹1,000
Receiver unchanged
No successful transaction
No money_received event
```

---

## 15. Offline Recipient

If Rahul is offline:

```text
Anant sends ₹500
        ↓
Database updated
        ↓
Transaction persisted
        ↓
Rahul receives no real-time event
```

This is fine.

When Rahul logs in/reconnects:

```text
GET current balance
GET transaction history
```

and sees the correct state.

**Database persistence must never depend on Socket.IO delivery.**

---

## 16. Reconnection Handling

Frontend should handle:

```text
connect
disconnect
connect_error
reconnect
```

After reconnecting, refresh important state:

```text
GET /api/v1/accounts/me
GET /api/v1/transactions
```

This prevents missed Socket.IO events from leaving stale data on screen.

---

## 17. Duplicate Event Protection

Use `transactionId` as the unique identifier.

If the same event is received twice, the UI must not display the transaction twice.

Before inserting a transaction into local state:

```text
Does transactionId already exist?
    YES → ignore duplicate
    NO  → add transaction
```

The database remains the final authority.

---

## 18. Backend Structure

Recommended:

```text
server/src/

├── controllers/
│   └── transferController.js
│
├── services/
│   ├── transferService.js
│   └── notificationService.js
│
├── sockets/
│   ├── socket.js
│   └── events.js
│
├── models/
│   ├── User.js
│   ├── Account.js
│   └── Transaction.js
│
├── routes/
│   ├── authRoutes.js
│   ├── accountRoutes.js
│   ├── transferRoutes.js
│   └── transactionRoutes.js
│
└── middleware/
    ├── auth.js
    ├── errorHandler.js
    └── rateLimiter.js
```

Follow the existing project's architecture if it already has one. Do not rewrite unrelated code just to match this structure.

---

## 19. Transfer Service

The core service should conceptually perform:

```text
1. Authenticate sender
2. Validate input
3. Find sender
4. Find receiver
5. Validate both accounts
6. Ensure sender != receiver
7. Start MongoDB transaction
8. Verify available balance
9. Debit sender
10. Credit receiver
11. Create transaction record
12. Commit
13. Return successful transfer data
```

Then emit the Socket.IO event only after successful completion.

---

## 20. Rate Limiting

Keep rate limiting enabled.

Protect especially:

```text
POST /api/v1/auth/login
POST /api/v1/auth/register
POST /api/v1/transfers
```

The transfer endpoint should have stricter protection against repeated/abusive requests.

Return:

```text
429 Too Many Requests
```

when limits are exceeded.

Socket connections must also require authentication. Do not allow unauthenticated users to subscribe to arbitrary user rooms.

---

## 21. Optional Notification Center

If the core system is complete, add:

```text
🔔 1
```

Example:

```text
Notifications

💰 ₹500 received from Anant Jain
   2 minutes ago

💰 ₹1,000 received from Rahul
   Yesterday
```

This is optional. Do not build complicated notification infrastructure.

---

## 22. Optional Transaction Details

Clicking a notification/transaction can show:

```text
Transaction Details

Status: SUCCESS
Transaction ID: TXN_8F92K1

From:
Anant Jain
Account: ••••6060

To:
Rahul
Account: ••••7821

Amount:
₹500.00

Description:
Dinner

Date:
18 Sep 2026, 12:48 AM
```

This is a UI enhancement, not part of the core transfer mechanism.

---

## 23. Testing

### Test 1 — Successful Transfer

```text
User A → User B ₹500
```

Verify:

```text
✓ A balance decreases
✓ B balance increases
✓ Transaction created
✓ A history updated
✓ B history updated
✓ B receives money_received
✓ B sees notification
✓ B balance refreshes
✓ B transaction list refreshes
```

### Test 2 — Insufficient Balance

```text
A balance = ₹100
Transfer = ₹500
```

Verify:

```text
✓ Transfer rejected
✓ A unchanged
✓ B unchanged
✓ No successful transaction
✓ No money_received event
```

### Test 3 — Recipient Offline

```text
B disconnected
A sends ₹500
```

Verify:

```text
✓ Database updated
✓ Transaction persisted
✓ No real-time notification
✓ B sees correct state after reconnect/login
```

### Test 4 — Duplicate Event

Verify:

```text
✓ Same transaction is not displayed twice
```

### Test 5 — Reconnect

Verify:

```text
✓ Socket reconnects
✓ Balance refreshes
✓ Transactions refresh
```

### Test 6 — Concurrent Transfers

Verify that simultaneous transfers cannot spend the same balance incorrectly.

---

## 24. Acceptance Checklist

- [ ] Socket.IO integrated with existing HTTP server
- [ ] Socket authentication implemented
- [ ] Private user-specific rooms implemented
- [ ] Transfer remains REST API based
- [ ] MongoDB transaction updates sender and receiver atomically
- [ ] Transaction record created
- [ ] Socket event emitted only after successful DB commit
- [ ] Recipient receives `money_received`
- [ ] Notification shows sender name
- [ ] Notification shows masked account number
- [ ] Notification shows amount
- [ ] Notification shows transaction ID
- [ ] Notification shows timestamp/details
- [ ] Recipient balance refreshed from backend
- [ ] Recipient transaction history refreshed
- [ ] Sender UI updates after successful transfer
- [ ] Failed transfers do not emit success events
- [ ] Offline recipients still get correct state later
- [ ] Duplicate events do not duplicate transactions
- [ ] Rate limiting remains enabled
- [ ] No sensitive data exposed through socket payloads
- [ ] Existing functionality remains intact
- [ ] Tests cover the real-time transfer flow

---

# 25. Implementation Order — Follow This Order

## Step 1 — Verify Existing Transfer

First make sure:

```text
A → B transfer works
A balance decreases
B balance increases
Transaction created
Insufficient balance rejected
```

Do not start Socket.IO until this works correctly.

---

## Step 2 — Make Transfer Atomic

Implement/verify:

```text
Debit sender
Credit receiver
Create transaction
        ↓
     COMMIT
```

Rollback everything on failure.

---

## Step 3 — Add Socket.IO Backend

Implement:

```text
HTTP Server
    ↓
Socket.IO
```

Then add:

```text
Socket authentication
User-specific rooms
```

---

## Step 4 — Emit Event After Commit

After a successful database commit:

```text
COMMIT
  ↓
money_received
```

Send only to the recipient's private room.

---

## Step 5 — Add Frontend Listener

Listen for:

```text
money_received
```

Show the money-received notification.

---

## Step 6 — Refresh Recipient State

After receiving the event:

```text
Fetch balance
Fetch transactions
```

Update the UI from server data.

---

## Step 7 — Add Reconnection

Handle:

```text
disconnect
reconnect
```

Refresh state after reconnect.

---

## Step 8 — Add Duplicate Protection

Use:

```text
transactionId
```

to prevent duplicate transaction entries.

---

## Step 9 — Test

Test:

```text
Successful transfer
Failed transfer
Insufficient balance
Offline recipient
Reconnect
Duplicate event
Multiple tabs
Concurrent transfers
```

---

## Step 10 — Polish UI

Finally add:

```text
Toast notification
Transaction details
Notification center (optional)
Live connection indicator (optional)
```

Do not spend time on UI polish before the transfer logic is reliable.

---

# 26. Final Desired Experience

### Sender

```text
Anant
Balance: ₹5,000

Send ₹500 to Rahul

        ↓

✓ Transfer Successful

₹500 sent to Rahul
Transaction ID: TXN_8F92K1

Balance:
₹4,500
```

### Recipient — Without Refreshing

```text
Rahul
Balance: ₹2,000

        ↓

💰 Money Received

Anant Jain sent you ₹500.00
Account: ••••6060
Transaction: TXN_8F92K1

New Balance:
₹2,500
```

Transaction history immediately becomes:

```text
+ ₹500.00
Received from Anant Jain
SUCCESS
TXN_8F92K1
```

---

# 27. Final Architecture

```text
                    ┌──────────────────┐
                    │    React App     │
                    └────────┬─────────┘
                             │
                    ┌────────┴─────────┐
                    │                  │
                  REST              Socket.IO
                    │                  │
                    ▼                  ▲
             ┌──────────────┐          │
             │   Express    │          │
             └──────┬───────┘          │
                    │                  │
                    ▼                  │
             ┌──────────────┐          │
             │   Transfer   │          │
             │   Service    │          │
             └──────┬───────┘          │
                    │                  │
                    ▼                  │
             ┌──────────────┐          │
             │   MongoDB    │          │
             │ Transaction  │          │
             └──────┬───────┘          │
                    │                  │
                  COMMIT               │
                    │                  │
                    └───────► Emit ────┘
                              │
                              ▼
                       Recipient Browser
                              │
                    ┌─────────┴─────────┐
                    ▼                   ▼
                Notification       Refetch State
                                        │
                                  ┌─────┴─────┐
                                  ▼           ▼
                               Balance    Transactions
```

## Key Principle

**Database first. Real-time notification second.**

The financial state must remain correct even if Socket.IO is completely unavailable.

Socket.IO only makes the already-correct database state appear immediately in the recipient's UI.
