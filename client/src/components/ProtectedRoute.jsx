import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import { LoadingSpinner } from './LoadingSpinner'

export const ProtectedRoute = () => {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="gradient-bg flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" message="Loading..." />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}
