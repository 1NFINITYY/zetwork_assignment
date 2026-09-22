import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import { LoadingSpinner } from './LoadingSpinner'

/**
 * PublicRoute — the mirror of ProtectedRoute.
 *
 * Allows unauthenticated users through (to /login, /register, etc.).
 * Redirects already-authenticated users to /dashboard so they can't
 * "tamper" back to the login page by typing the URL manually.
 */
export const PublicRoute = () => {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="gradient-bg flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" message="Loading..." />
      </div>
    )
  }

  // Already logged in → kick back to dashboard
  if (user) {
    return <Navigate to="/dashboard" replace />
  }

  return <Outlet />
}
