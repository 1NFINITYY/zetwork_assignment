import { formatCurrency } from './TransactionRow'

export const ConfirmModal = ({ isOpen, onClose, onConfirm, transferData, loading }) => {
  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
    >
      <div
        className="glass-card fade-in w-full max-w-md p-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-2xl"
            style={{ background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)' }}
          >
            💸
          </div>
        </div>

        <h2 className="text-xl font-bold text-center mb-2">Confirm Transfer</h2>
        <p className="text-sm text-center mb-6" style={{ color: 'var(--text-muted)' }}>
          Are you sure you want to proceed?
        </p>

        {/* Transfer details */}
        <div
          className="rounded-xl p-4 mb-6 space-y-3"
          style={{ background: 'rgba(15,23,42,0.6)', border: '1px solid var(--border-subtle)' }}
        >
          <div className="flex justify-between items-center">
            <span style={{ color: 'var(--text-muted)' }} className="text-sm">Sending</span>
            <span className="font-bold text-lg" style={{ color: '#60a5fa' }}>
              {transferData?.amount ? formatCurrency(Math.round(transferData.amount * 100)) : '—'}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span style={{ color: 'var(--text-muted)' }} className="text-sm">To Account</span>
            <span className="font-mono text-sm font-medium">
              ···· {transferData?.receiverAccountNumber?.slice(-4)}
            </span>
          </div>
          {transferData?.description && (
            <div className="flex justify-between items-center">
              <span style={{ color: 'var(--text-muted)' }} className="text-sm">Description</span>
              <span className="text-sm text-right max-w-[60%] truncate">
                {transferData.description}
              </span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="btn-ghost flex-1"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="btn-primary flex-1"
            style={{ width: 'auto' }}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div
                  className="h-4 w-4 animate-spin rounded-full border-2 border-transparent"
                  style={{ borderTopColor: 'white' }}
                />
                Processing…
              </span>
            ) : (
              'Confirm Transfer'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
