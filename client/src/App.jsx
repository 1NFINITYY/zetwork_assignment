import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ServerStatusProvider } from './context/ServerStatusContext'
import { useServerStatus } from './context/useServerStatus'
import { SocketProvider } from './context/SocketContext'
import { ServerWakingScreen } from './components/ServerWakingScreen'
import { MoneyToastContainer } from './components/MoneyToast'
import { ProtectedRoute } from './components/ProtectedRoute'
import { PublicRoute } from './components/PublicRoute'
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

function AppInner() {
  const { status } = useServerStatus()

  return (
    <>
      {status === 'WAKING' && <ServerWakingScreen />}

      {/* Global money received toast — renders on top of everything */}
      <MoneyToastContainer />

      <BrowserRouter>
        <AuthProvider>
          {/* SocketProvider inside AuthProvider so auth cookie is available for WS handshake */}
          <SocketProvider>
            <Routes>
              {/* PublicRoute: redirects logged-in users to /dashboard */}
              <Route element={<PublicRoute />}>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
              </Route>

              <Route element={<ProtectedRoute />}>
                <Route path="/dashboard/*" element={<DashboardLayout />} />
              </Route>

              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </SocketProvider>
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
