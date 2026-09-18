import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import { Landmark, Send, History, User, LogOut, ArrowRightLeft } from 'lucide-react'

export const Navbar = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const navLinks = [
    { to: '/dashboard', label: 'Dashboard', icon: Landmark, end: true },
    { to: '/dashboard/send', label: 'Send Money', icon: Send },
    { to: '/dashboard/transactions', label: 'Transactions', icon: History },
    { to: '/dashboard/profile', label: 'Profile', icon: User },
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
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm shadow-md"
            style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' }}
          >
            <ArrowRightLeft className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-base tracking-wide bg-gradient-to-r from-blue-400 to-indigo-300 bg-clip-text text-transparent">
            ZetPay
          </span>
        </div>

        {/* Nav links */}
        <div className="hidden sm:flex items-center gap-1">
          {navLinks.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `nav-item flex items-center gap-2 ${isActive ? 'active' : ''}`
              }
            >
              <Icon className="w-4 h-4 opacity-80" />
              <span>{label}</span>
            </NavLink>
          ))}
        </div>

        {/* User + Logout */}
        <div className="flex items-center gap-3">
          <span className="hidden sm:block text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
            {user?.name}
          </span>
          <button
            onClick={handleLogout}
            className="btn-ghost text-xs px-3 py-1.5 flex items-center gap-1.5 hover:text-red-400"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Mobile nav */}
      <div
        className="sm:hidden flex overflow-x-auto px-4 pb-2 gap-1"
        style={{ scrollbarWidth: 'none' }}
      >
        {navLinks.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `nav-item whitespace-nowrap text-xs flex items-center gap-1.5 ${isActive ? 'active' : ''}`
            }
          >
            <Icon className="w-3.5 h-3.5 opacity-80" />
            <span>{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
