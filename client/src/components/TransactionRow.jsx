/**
 * Format paise to Indian Rupee display string.
 * @param {number} paise
 * @returns {string} e.g., "₹1,000.00"
 */
export const formatCurrency = (paise) => {
  const rupees = paise / 100
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
  }).format(rupees)
}

export const TransactionRow = ({ tx }) => {
  const isSent = tx.type === 'SENT'

  return (
    <tr
      className="transition-colors duration-150"
      style={{ borderBottom: '1px solid var(--border-subtle)' }}
      onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(59,130,246,0.04)')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
    >
      {/* Transaction ID */}
      <td className="py-4 px-4">
        <span
          className="font-mono text-xs font-medium"
          style={{ color: 'var(--text-muted)' }}
          title={tx.transactionId}
        >
          {tx.transactionId.slice(0, 12)}…
        </span>
      </td>

      {/* Type badge */}
      <td className="py-4 px-4">
        <span className={isSent ? 'badge-sent' : 'badge-received'}>
          {isSent ? '↑ SENT' : '↓ RECEIVED'}
        </span>
      </td>

      {/* Amount */}
      <td className="py-4 px-4">
        <span
          className="font-bold text-sm"
          style={{ color: isSent ? '#f87171' : '#34d399' }}
        >
          {isSent ? '-' : '+'}{formatCurrency(tx.amountPaise)}
        </span>
      </td>

      {/* Other account */}
      <td className="py-4 px-4">
        <span className="font-mono text-xs" style={{ color: 'var(--text-muted)' }}>
          {tx.otherAccount || '—'}
        </span>
      </td>

      {/* Status */}
      <td className="py-4 px-4">
        <span className={tx.status === 'SUCCESS' ? 'badge-success' : 'badge-failed'}>
          {tx.status}
        </span>
      </td>

      {/* Date */}
      <td className="py-4 px-4">
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
          {new Date(tx.createdAt).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          })}
          <br />
          <span style={{ opacity: 0.7 }}>
            {new Date(tx.createdAt).toLocaleTimeString('en-IN', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </span>
      </td>

      {/* Description */}
      <td className="py-4 px-4 max-w-[150px]">
        <span className="text-xs truncate block" style={{ color: 'var(--text-muted)' }}>
          {tx.description || '—'}
        </span>
      </td>
    </tr>
  )
}
