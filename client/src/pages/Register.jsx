import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { register } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!form.name || !form.email || !form.password) {
      setError('Please fill in all fields.')
      return
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }

    setLoading(true)
    try {
      await register(form)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="gradient-bg min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md fade-in">
        {/* Header */}
        <div className="text-center mb-8">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center font-bold text-2xl mx-auto mb-4"
            style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' }}
          >
            Z
          </div>
          <h1 className="text-3xl font-bold mb-2">Create Account</h1>
          <p style={{ color: 'var(--text-muted)' }} className="text-sm">
            Open your ZetPay account — get ₹10,000 instantly
          </p>
        </div>

        {/* Card */}
        <div className="glass-card p-8">
          {error && (
            <div
              className="rounded-xl p-3 mb-5 flex items-center gap-2 text-sm"
              style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}
            >
              <span>⚠</span> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>
                Full Name
              </label>
              <input
                id="register-name"
                type="text"
                className="input-field"
                placeholder="Your full name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                autoComplete="name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>
                Email Address
              </label>
              <input
                id="register-email"
                type="email"
                className="input-field"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                autoComplete="email"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>
                Password
              </label>
              <input
                id="register-password"
                type="password"
                className="input-field"
                placeholder="Min. 8 characters"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                autoComplete="new-password"
                required
                minLength={8}
              />
              {form.password.length > 0 && form.password.length < 8 && (
                <p className="mt-1 text-xs" style={{ color: '#f87171' }}>
                  Need {8 - form.password.length} more character{8 - form.password.length !== 1 ? 's' : ''}
                </p>
              )}
            </div>

            <button id="register-submit" type="submit" className="btn-primary" disabled={loading}>
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-transparent" style={{ borderTopColor: 'white' }} />
                  Creating account…
                </span>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          <p className="text-center mt-6 text-sm" style={{ color: 'var(--text-muted)' }}>
            Already have an account?{' '}
            <Link to="/login" className="font-semibold" style={{ color: '#60a5fa' }}>
              Sign in
            </Link>
          </p>
        </div>

        {/* Note */}
        <p className="text-center mt-4 text-xs" style={{ color: 'var(--text-muted)', opacity: 0.6 }}>
          Demo banking app. All transfers are simulated.
        </p>
      </div>
    </div>
  )
}
