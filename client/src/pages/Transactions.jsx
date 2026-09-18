import { useState, useCallback } from 'react'
import { useTransactions } from '../hooks/useTransactions'
import { useMoneyReceived } from '../hooks/useMoneyReceived'
import { addMoneyToast } from '../components/MoneyToast'
import { TransactionRow } from '../components/TransactionRow'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { ErrorBanner } from '../components/ErrorBanner'
import { Pagination } from '../components/Pagination'
import { Inbox } from 'lucide-react'

export default function Transactions() {
  const [page, setPage] = useState(1)
  const LIMIT = 20
  const { transactions, pagination, loading, error, refetch } = useTransactions(page, LIMIT)

  // Real-time: refetch transaction list when money is received
  const handleMoneyReceived = useCallback((payload) => {
    addMoneyToast(payload)
    refetch()
  }, [refetch])

  useMoneyReceived(handleMoneyReceived)

  return (
    <div className="gradient-bg min-h-screen">
      <div className="max-w-6xl mx-auto px-4 py-8 fade-in">

        <div className="mb-6">
          <h1 className="text-2xl font-bold">Transaction History</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            Complete record of all your transfers
          </p>
        </div>

        {/* Summary stats */}
        {pagination && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
            <div className="glass-card p-4">
              <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Total Transactions</p>
              <p className="text-2xl font-bold">{pagination.total}</p>
            </div>
            <div className="glass-card p-4">
              <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Current Page</p>
              <p className="text-2xl font-bold">{pagination.page} / {pagination.totalPages}</p>
            </div>
            <div className="glass-card p-4 col-span-2 sm:col-span-1">
              <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Per Page</p>
              <p className="text-2xl font-bold">{LIMIT}</p>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="glass-card overflow-hidden">
          {loading ? (
            <div className="flex justify-center py-20">
              <LoadingSpinner size="lg" message="Loading transactions..." />
            </div>
          ) : error ? (
            <div className="p-8">
              <ErrorBanner message={error} onRetry={refetch} />
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)' }}>
                <Inbox className="w-8 h-8 text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No transactions yet</h3>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                Your transaction history will appear here after your first transfer.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    {['Transaction ID', 'Type', 'Amount', 'Other Account', 'Status', 'Date & Time', 'Description'].map((h) => (
                      <th
                        key={h}
                        className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => (
                    <TransactionRow key={tx.transactionId} tx={tx} />
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {!loading && !error && (
            <div className="px-6 pb-6">
              <Pagination
                pagination={pagination}
                onPageChange={(p) => setPage(p)}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
