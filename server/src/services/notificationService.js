const EVENTS = require('../sockets/events')
const { getIO } = require('../sockets/socket')

/**
 * Mask an account number: show only last 4 digits.
 * Example: "1012345678" → "••••5678"
 */
function maskAccountNumber(accountNumber) {
  if (!accountNumber || accountNumber.length < 4) return '••••'
  const last4 = accountNumber.slice(-4)
  return `••••${last4}`
}

/**
 * Emit a money_received event to the recipient's private room.
 *
 * Called only AFTER successful MongoDB transaction commit (spec §13).
 * Never called on failed transfers.
 *
 * Payload (spec §6):
 * {
 *   type: 'MONEY_RECEIVED',
 *   transactionId: string,
 *   sender: { name: string, accountNumberMasked: string },
 *   amountPaise: number,
 *   currency: 'INR',
 *   description: string,
 *   receivedAt: ISO string,
 * }
 *
 * Security (spec §7): No passwords, tokens, full account numbers, or DB credentials.
 */
function emitMoneyReceived({ receiverUserId, senderName, senderAccountNumber, transaction }) {
  try {
    const io = getIO()
    const room = `user:${receiverUserId.toString()}`

    const payload = {
      type: 'MONEY_RECEIVED',
      transactionId: transaction.transactionId,
      sender: {
        name: senderName,
        accountNumberMasked: maskAccountNumber(senderAccountNumber),
      },
      amountPaise: transaction.amountPaise,
      currency: transaction.currency || 'INR',
      description: transaction.description || '',
      receivedAt: transaction.createdAt || new Date().toISOString(),
    }

    io.to(room).emit(EVENTS.MONEY_RECEIVED, payload)
  } catch (err) {
    // Socket emit failure must never break the transfer response.
    // The DB commit already succeeded — this is purely a UI notification.
    console.error('⚠️  Socket emit failed (non-critical):', err.message)
  }
}

module.exports = { emitMoneyReceived }
