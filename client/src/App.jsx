import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ServerStatusProvider } from './context/ServerStatusContext'
import { useServerStatus } from './context/useServerStatus'
import { ServerWakingScreen } from './components/ServerWakingScreen'
import { ProtectedRoute } from './components/ProtectedRoute'
import { Navbar } from './components/Navbar'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import SendMoney from './pages/SendMoney'
import Transactions from './pages/Transactions'
import Profile from './pages/Profile'

function DashboardLayout() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route index element={<Dashboard />} />
        <Route path="send" element={<SendMoney />} />
        <Route path="transactions" element={<Transactions />} />
        <Route path="profile" element={<Profile />} />
      </Routes>
    </>
  )
}

/**
 * Inner app — has access to ServerStatusContext.
 * Callback is already registered synchronously inside ServerStatusProvider,
 * so no useEffect needed here.
 */
function AppInner() {
  const { status } = useServerStatus()

  return (
    <>
      {/* Full-screen overlay when server is sleeping */}
      {status === 'WAKING' && <ServerWakingScreen />}

      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Protected routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard/*" element={<DashboardLayout />} />
            </Route>

            {/* Default redirect */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </>
  )
}

export default function App() {
  return (
    <ServerStatusProvider>
      <AppInner />
    </ServerStatusProvider>
  )
}
