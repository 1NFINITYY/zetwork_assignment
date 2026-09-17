import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import { useAccount } from '../hooks/useAccount'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { ErrorBanner } from '../components/ErrorBanner'
import { formatCurrency } from '../components/TransactionRow'

const InfoRow = ({ label, value, mono = false }) => (
  <div
    className="flex justify-between items-center py-3"
    style={{ borderBottom: '1px solid var(--border-subtle)' }}
  >
    <span className="text-sm" style={{ color: 'var(--text-muted)' }}>{label}</span>
    <span className={`font-medium text-sm ${mono ? 'font-mono' : ''}`}>{value}</span>
  </div>
)

export default function Profile() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { account, loading, error, refetch } = useAccount()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <div className="gradient-bg min-h-screen">
      <div className="max-w-2xl mx-auto px-4 py-8 fade-in space-y-6">

        <div>
          <h1 className="text-2xl font-bold">Profile</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            Your account details
          </p>
        </div>

        {/* Avatar + name */}
        <div className="glass-card p-6 flex items-center gap-5">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' }}
          >
            {user?.name?.charAt(0)?.toUpperCase()}
          </div>
          <div>
            <h2 className="text-xl font-bold">{user?.name}</h2>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{user?.email}</p>
            <span className="badge-success mt-1 inline-block">Verified</span>
          </div>
        </div>

        {/* User info */}
        <div className="glass-card p-6">
          <h3 className="text-sm font-semibold uppercase tracking-wider mb-4" style={{ color: 'var(--text-muted)' }}>
            Personal Information
          </h3>
          <InfoRow label="Full Name" value={user?.name || '—'} />
          <InfoRow label="Email Address" value={user?.email || '—'} />
          <InfoRow label="Member Since" value={user ? new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }) : '—'} />
        </div>

        {/* Account info */}
        <div className="glass-card p-6">
          <h3 className="text-sm font-semibold uppercase tracking-wider mb-4" style={{ color: 'var(--text-muted)' }}>
            Bank Account
          </h3>
          {loading ? (
            <div className="py-4 flex justify-center">
              <LoadingSpinner message="Loading account..." />
            </div>
          ) : error ? (
            <ErrorBanner message={error} onRetry={refetch} />
          ) : (
            <>
              <InfoRow label="Account Number" value={account?.accountNumber || '—'} mono />
              <InfoRow label="Balance" value={account ? formatCurrency(account.balancePaise) : '—'} />
              <InfoRow label="Currency" value={account?.currency || 'INR'} />
              <InfoRow
                label="Account Status"
                value={
                  <span className={account?.status === 'ACTIVE' ? 'badge-success' : 'badge-failed'}>
                    {account?.status || '—'}
                  </span>
                }
              />
              <InfoRow
                label="Opened"
                value={account ? new Date(account.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }) : '—'}
              />
            </>
          )}
        </div>

        {/* Security info */}
        <div className="glass-card p-6">
          <h3 className="text-sm font-semibold uppercase tracking-wider mb-4" style={{ color: 'var(--text-muted)' }}>
            Security
          </h3>
          <InfoRow label="Password" value="••••••••" />
          <InfoRow label="2FA" value="Not configured" />
          <InfoRow label="Session" value="JWT · HTTP-only Cookie" mono />
        </div>

        {/* Logout */}
        <button
          id="profile-logout"
          onClick={handleLogout}
          className="btn-danger w-full py-3 rounded-xl font-semibold text-sm"
        >
          Sign Out
        </button>

        <p className="text-center text-xs pb-4" style={{ color: 'var(--text-muted)', opacity: 0.5 }}>
          ZetPay Banking Demo · All transactions are simulated
        </p>
      </div>
    </div>
  )
}
