import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useAccount } from '../hooks/useAccount'
import { useTransactions } from '../hooks/useTransactions'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { ErrorBanner } from '../components/ErrorBanner'
import { TransactionRow, formatCurrency } from '../components/TransactionRow'

// Copy account number card — replaces the old dummy "Secure" button
function CopyAccountCard({ accountNumber }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    if (!accountNumber) return
    navigator.clipboard.writeText(accountNumber).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <button
      onClick={handleCopy}
      disabled={!accountNumber}
      className="glass-card p-5 flex flex-col items-center gap-3 transition-all duration-200 w-full"
      style={{ cursor: accountNumber ? 'pointer' : 'default', opacity: accountNumber ? 1 : 0.5, background: 'none' }}
      onMouseEnter={(e) => { if (accountNumber) e.currentTarget.style.transform = 'translateY(-2px)' }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)' }}
      title={accountNumber ? `Copy: ${accountNumber}` : 'Loading...'}
    >
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center text-xl"
        style={{ background: copied ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)', border: `1px solid ${copied ? 'rgba(16,185,129,0.4)' : 'rgba(245,158,11,0.4)'}`, transition: 'all 0.2s' }}
      >
        {copied ? '✅' : '📋'}
      </div>
      <span className="text-sm font-medium" style={{ color: copied ? '#34d399' : 'inherit', transition: 'color 0.2s' }}>
        {copied ? 'Copied!' : 'Copy Acc. No.'}
      </span>
    </button>
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  const { account, loading: accLoading, error: accError, refetch: refetchAccount } = useAccount()
  const { transactions, loading: txLoading, error: txError, refetch: refetchTx } = useTransactions(1, 5)

  return (
    <div className="gradient-bg min-h-screen">
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6 fade-in">

        {/* Welcome Banner */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">
              Welcome back, {user?.name?.split(' ')[0]} 👋
            </h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
              Here&apos;s your financial overview
            </p>
          </div>
          <Link
            to="/dashboard/send"
            className="btn-primary text-sm"
            style={{ width: 'auto', padding: '0.625rem 1.25rem' }}
          >
            💸 Send Money
          </Link>
        </div>

        {/* Balance Card */}
        <div
          className="balance-card rounded-2xl p-8 relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #1e3a5f 0%, #1a1f3a 50%, #2d1b4e 100%)' }}
        >
          {/* Decorative circles */}
          <div
            className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10"
            style={{ background: 'radial-gradient(circle, #60a5fa, transparent)', transform: 'translate(30%, -30%)' }}
          />
          <div
            className="absolute bottom-0 left-0 w-48 h-48 rounded-full opacity-10"
            style={{ background: 'radial-gradient(circle, #a78bfa, transparent)', transform: 'translate(-30%, 30%)' }}
          />

          <div className="relative">
            <p className="text-sm font-medium mb-1" style={{ color: 'rgba(255,255,255,0.6)' }}>
              Available Balance
            </p>
            {accLoading ? (
              <div className="skeleton h-12 w-48 mb-4" />
            ) : accError ? (
              <p className="text-red-400 text-lg font-bold mb-4">—</p>
            ) : (
              <h2 className="text-4xl font-bold mb-4" style={{ letterSpacing: '-0.02em' }}>
                {account ? formatCurrency(account.balancePaise) : '—'}
              </h2>
            )}

            <div className="flex items-center gap-6 flex-wrap">
              <div>
                <p className="text-xs mb-1" style={{ color: 'rgba(255,255,255,0.5)' }}>Account Number</p>
                {accLoading ? (
                  <div className="skeleton h-5 w-32" />
                ) : (
                  <p className="font-mono font-medium text-sm">
                    {account?.accountNumber || '—'}
                  </p>
                )}
              </div>
              <div>
                <p className="text-xs mb-1" style={{ color: 'rgba(255,255,255,0.5)' }}>Currency</p>
                <p className="font-medium text-sm">{account?.currency || 'INR'}</p>
              </div>
              <div>
                <p className="text-xs mb-1" style={{ color: 'rgba(255,255,255,0.5)' }}>Status</p>
                <span className="badge-success">{account?.status || '—'}</span>
              </div>
            </div>
          </div>
        </div>

        {accError && (
          <ErrorBanner message={accError} onRetry={refetchAccount} />
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { icon: '💸', label: 'Send Money', to: '/dashboard/send', color: '#3b82f6' },
            { icon: '📋', label: 'History', to: '/dashboard/transactions', color: '#8b5cf6' },
            { icon: '👤', label: 'Profile', to: '/dashboard/profile', color: '#10b981' },
          ].map(({ icon, label, to, color }) => (
            <Link
              key={label}
              to={to}
              className="glass-card p-5 flex flex-col items-center gap-3 transition-all duration-200"
              style={{ textDecoration: 'none' }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)' }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)' }}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-xl"
                style={{ background: `${color}20`, border: `1px solid ${color}40` }}
              >
                {icon}
              </div>
              <span className="text-sm font-medium">{label}</span>
            </Link>
          ))}

          {/* Copy Account Number */}
          <CopyAccountCard accountNumber={account?.accountNumber} />
        </div>

        {/* Recent Transactions */}
        <div className="glass-card overflow-hidden">
          <div className="flex items-center justify-between p-6 pb-4">
            <h2 className="text-lg font-bold">Recent Transactions</h2>
            <Link
              to="/dashboard/transactions"
              className="text-sm font-medium"
              style={{ color: '#60a5fa' }}
            >
              View all →
            </Link>
          </div>

          {txLoading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner message="Loading transactions..." />
            </div>
          ) : txError ? (
            <div className="p-6 pt-0">
              <ErrorBanner message={txError} onRetry={refetchTx} />
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-4xl mb-3">📭</div>
              <p className="font-medium mb-1">No transactions yet</p>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                Send your first transfer to get started
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    {['ID', 'Type', 'Amount', 'Account', 'Status', 'Date', 'Description'].map((h) => (
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
        </div>

      </div>
    </div>
  )
}
