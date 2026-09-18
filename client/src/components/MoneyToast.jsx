import { useState, useEffect } from 'react'
import { Coins, X } from 'lucide-react'

/**
 * MoneyToast
 *
 * Rich slide-in toast for money_received events (spec §8).
 * Shows: sender name, masked account, amount, transaction ID.
 * Auto-dismisses after 6 seconds. Has a close button.
 */

function formatAmountPaise(paise) {
  return `₹${(paise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
}

function SingleToast({ toast, onClose }) {
  const [visible, setVisible] = useState(false)
  const [leaving, setLeaving] = useState(false)

  useEffect(() => {
    // Trigger slide-in
    const t = setTimeout(() => setVisible(true), 10)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    // Auto-dismiss after 6 seconds
    const t = setTimeout(() => handleClose(), 6000)
    return () => clearTimeout(t)
  }, [])

  const handleClose = () => {
    setLeaving(true)
    setTimeout(() => onClose(toast.id), 300)
  }

  return (
    <div
      style={{
        background: 'rgba(17, 24, 39, 0.97)',
        border: '1px solid rgba(16, 185, 129, 0.4)',
        borderRadius: '1rem',
        padding: '1rem 1.25rem',
        width: '320px',
        boxShadow: '0 20px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(16,185,129,0.1)',
        transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
        transform: visible && !leaving ? 'translateX(0) scale(1)' : 'translateX(120%) scale(0.95)',
        opacity: visible && !leaving ? 1 : 0,
        cursor: 'default',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ padding: '4px', borderRadius: '8px', background: 'rgba(16,185,129,0.15)' }}>
            <Coins style={{ width: '1.1rem', height: '1.1rem', color: '#34d399' }} />
          </div>
          <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#34d399' }}>
            Money Received
          </span>
        </div>
        <button
          onClick={handleClose}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            padding: '2px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          aria-label="Close"
        >
          <X style={{ width: '1rem', height: '1rem' }} />
        </button>
      </div>

      {/* Amount */}
      <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f1f5f9', marginBottom: '0.25rem' }}>
        {formatAmountPaise(toast.amountPaise)}
      </div>

      {/* Sender */}
      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
        from <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{toast.sender?.name}</span>
        {toast.sender?.accountNumberMasked && (
          <span style={{ marginLeft: '0.4rem', fontFamily: 'monospace', fontSize: '0.8rem' }}>
            {toast.sender.accountNumberMasked}
          </span>
        )}
      </div>

      {/* Description */}
      {toast.description && (
        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.4rem', fontStyle: 'italic' }}>
          "{toast.description}"
        </div>
      )}

      {/* Transaction ID */}
      <div style={{
        fontSize: '0.7rem',
        color: 'rgba(148,163,184,0.6)',
        fontFamily: 'monospace',
        borderTop: '1px solid rgba(148,163,184,0.1)',
        paddingTop: '0.4rem',
        marginTop: '0.4rem',
      }}>
        {toast.transactionId}
      </div>

      {/* Progress bar */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        height: '3px',
        borderRadius: '0 0 1rem 1rem',
        background: 'linear-gradient(90deg, #10b981, #34d399)',
        animation: 'shrink 6s linear forwards',
        width: '100%',
      }} />

      <style>{`
        @keyframes shrink {
          from { width: 100%; }
          to   { width: 0%; }
        }
      `}</style>
    </div>
  )
}

/**
 * MoneyToastContainer
 *
 * Manages a stack of toasts. Mount this once at the app root level.
 * Use the exported addToast() function to add toasts from anywhere.
 */
let _addToast = null

export function addMoneyToast(payload) {
  if (_addToast) _addToast(payload)
}

export function MoneyToastContainer() {
  const [toasts, setToasts] = useState([])

  useEffect(() => {
    _addToast = (payload) => {
      setToasts((prev) => [
        ...prev,
        { ...payload, id: `${payload.transactionId}-${Date.now()}` },
      ])
    }
    return () => { _addToast = null }
  }, [])

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: '1.5rem',
        right: '1.5rem',
        zIndex: 99999,
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
        pointerEvents: 'none',
      }}
    >
      {toasts.map((toast) => (
        <div key={toast.id} style={{ pointerEvents: 'auto', position: 'relative' }}>
          <SingleToast toast={toast} onClose={removeToast} />
        </div>
      ))}
    </div>
  )
}
