import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'

export const Navbar = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const navLinks = [
    { to: '/dashboard', label: '🏦 Dashboard', end: true },
    { to: '/dashboard/send', label: '💸 Send Money' },
    { to: '/dashboard/transactions', label: '📋 Transactions' },
    { to: '/dashboard/profile', label: '👤 Profile' },
  ]

  return (
    <nav
      className="sticky top-0 z-40"
      style={{
        background: 'rgba(10, 15, 30, 0.9)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border-subtle)',
      }}
    >
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm"
            style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' }}
          >
            Z
          </div>
          <span className="font-bold text-sm tracking-wide">ZetPay</span>
        </div>

        {/* Nav links */}
        <div className="hidden sm:flex items-center gap-1">
          {navLinks.map(({ to, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              {label}
            </NavLink>
          ))}
        </div>

        {/* User + Logout */}
        <div className="flex items-center gap-3">
          <span className="hidden sm:block text-xs" style={{ color: 'var(--text-muted)' }}>
            {user?.name}
          </span>
          <button
            onClick={handleLogout}
            className="btn-ghost text-sm px-3 py-1.5"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Mobile nav */}
      <div
        className="sm:hidden flex overflow-x-auto px-4 pb-2 gap-1"
        style={{ scrollbarWidth: 'none' }}
      >
        {navLinks.map(({ to, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) => `nav-item whitespace-nowrap text-xs ${isActive ? 'active' : ''}`}
          >
            {label}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
