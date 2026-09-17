import { useState, useCallback } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { transferAPI } from '../services/api'
import { ConfirmModal } from '../components/ConfirmModal'
import { useAccount } from '../hooks/useAccount'
import { formatCurrency } from '../components/TransactionRow'

// We generate a UUID-based idempotency key per submit attempt
// so duplicate network retries don't double-charge

export default function SendMoney() {
  const { account, refetch: refetchAccount } = useAccount()
  const [form, setForm] = useState({ receiverAccountNumber: '', amount: '', description: '' })
  const [errors, setErrors] = useState({})
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null) // { success, message, transactionId }
  const [idempotencyKey, setIdempotencyKey] = useState(null)

  const validate = () => {
    const errs = {}
    if (!form.receiverAccountNumber.trim()) errs.receiverAccountNumber = 'Recipient account number is required'
    const amt = parseFloat(form.amount)
    if (!form.amount || isNaN(amt) || amt <= 0) errs.amount = 'Enter a valid amount greater than ₹0'
    if (account && amt > account.balancePaise / 100) errs.amount = 'Amount exceeds your available balance'
    return errs
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }
    setErrors({})
    // Generate a fresh idempotency key for this transfer attempt
    setIdempotencyKey(uuidv4())
    setShowConfirm(true)
  }

  const handleConfirm = async () => {
    setLoading(true)
    try {
      const res = await transferAPI.transfer(
        {
          receiverAccountNumber: form.receiverAccountNumber.trim(),
          amount: parseFloat(form.amount),
          description: form.description.trim(),
        },
        idempotencyKey
      )
      setResult({
        success: true,
        transactionId: res.data.data.transactionId,
        amount: res.data.data.amountRupees,
      })
      setForm({ receiverAccountNumber: '', amount: '', description: '' })
      refetchAccount() // Refresh balance
    } catch (err) {
      setResult({
        success: false,
        message: err.response?.data?.message || 'Transfer failed. Please try again.',
        code: err.response?.data?.code,
      })
    } finally {
      setLoading(false)
      setShowConfirm(false)
    }
  }

  const handleNewTransfer = useCallback(() => {
    setResult(null)
    setIdempotencyKey(null)
  }, [])

  // Success state
  if (result?.success) {
    return (
      <div className="gradient-bg min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md fade-in text-center">
          <div className="glass-card p-10">
            <div className="text-6xl mb-4">✅</div>
            <h2 className="text-2xl font-bold mb-2" style={{ color: '#34d399' }}>
              Transfer Successful!
            </h2>
            <p style={{ color: 'var(--text-muted)' }} className="mb-6">
              Your money is on its way.
            </p>

            <div
              className="rounded-xl p-4 mb-6 text-left space-y-3"
              style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)' }}
            >
              <div className="flex justify-between">
                <span style={{ color: 'var(--text-muted)' }} className="text-sm">Transaction ID</span>
                <span className="font-mono text-sm font-bold">{result.transactionId}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: 'var(--text-muted)' }} className="text-sm">Amount Transferred</span>
                <span className="font-bold" style={{ color: '#34d399' }}>
                  {formatCurrency(Math.round(result.amount * 100))}
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={handleNewTransfer} className="btn-primary" style={{ width: 'auto', flex: 1 }}>
                New Transfer
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Failure state
  if (result?.success === false) {
    return (
      <div className="gradient-bg min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md fade-in text-center">
          <div className="glass-card p-10">
            <div className="text-6xl mb-4">❌</div>
            <h2 className="text-2xl font-bold mb-2" style={{ color: '#f87171' }}>
              Transfer Failed
            </h2>
            <p style={{ color: 'var(--text-muted)' }} className="mb-2">
              {result.message}
            </p>
            {result.code && (
              <p className="text-xs mb-6 font-mono" style={{ color: 'rgba(248,113,113,0.6)' }}>
                Error: {result.code}
              </p>
            )}
            <button onClick={handleNewTransfer} className="btn-primary">
              Try Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="gradient-bg min-h-screen">
      <div className="max-w-2xl mx-auto px-4 py-8 fade-in">

        {/* Balance badge */}
        {account && (
          <div
            className="flex items-center justify-between rounded-xl p-4 mb-6"
            style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.15)' }}
          >
            <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Available Balance</span>
            <span className="font-bold text-lg" style={{ color: '#60a5fa' }}>
              {formatCurrency(account.balancePaise)}
            </span>
          </div>
        )}

        <div className="glass-card p-8">
          <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <span>💸</span> Send Money
          </h1>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Recipient */}
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>
                Recipient Account Number
              </label>
              <input
                id="transfer-receiver"
                type="text"
                className="input-field"
                placeholder="e.g., 1012345678"
                value={form.receiverAccountNumber}
                onChange={(e) => {
                  setForm({ ...form, receiverAccountNumber: e.target.value })
                  if (errors.receiverAccountNumber) setErrors({ ...errors, receiverAccountNumber: '' })
                }}
              />
              {errors.receiverAccountNumber && (
                <p className="mt-1 text-xs" style={{ color: '#f87171' }}>{errors.receiverAccountNumber}</p>
              )}
            </div>

            {/* Amount */}
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>
                Amount (₹)
              </label>
              <div className="relative">
                <span
                  className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-lg"
                  style={{ color: 'var(--text-muted)' }}
                >
                  ₹
                </span>
                <input
                  id="transfer-amount"
                  type="number"
                  className="input-field"
                  style={{ paddingLeft: '2rem' }}
                  placeholder="0.00"
                  min="0.01"
                  step="0.01"
                  value={form.amount}
                  onChange={(e) => {
                    setForm({ ...form, amount: e.target.value })
                    if (errors.amount) setErrors({ ...errors, amount: '' })
                  }}
                />
              </div>
              {errors.amount && (
                <p className="mt-1 text-xs" style={{ color: '#f87171' }}>{errors.amount}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>
                Description{' '}
                <span style={{ color: 'var(--text-muted)', opacity: 0.6 }}>(optional)</span>
              </label>
              <input
                id="transfer-description"
                type="text"
                className="input-field"
                placeholder="e.g., Dinner, Rent, etc."
                maxLength={200}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>

            <button id="transfer-submit" type="submit" className="btn-primary mt-2">
              Review Transfer →
            </button>
          </form>
        </div>

        {/* Info box */}
        <div
          className="rounded-xl p-4 mt-4 text-sm flex gap-3"
          style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.12)' }}
        >
          <span>🔒</span>
          <p style={{ color: 'var(--text-muted)' }}>
            All transfers are instant and ACID-protected. You'll see a confirmation before the money moves.
          </p>
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={showConfirm}
        onClose={() => !loading && setShowConfirm(false)}
        onConfirm={handleConfirm}
        loading={loading}
        transferData={{ ...form, amount: parseFloat(form.amount) }}
      />
    </div>
  )
}
