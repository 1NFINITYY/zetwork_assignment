import { createContext, useEffect, useState } from 'react'
import { io } from 'socket.io-client'
import { authAPI } from '../services/api'

export const SocketContext = createContext(null)

// In dev: connects to window.location.origin (Vite proxies /socket.io → localhost:5000)
// In prod: connects directly to the Render backend URL
const SOCKET_URL = import.meta.env.VITE_API_URL || window.location.origin

/**
 * SocketProvider
 *
 * Connects to Socket.IO server. Auth strategy:
 *  1. Fetches a short-lived (60s) token via GET /api/v1/auth/socket-token
 *  2. Passes it in io({ auth: { token } }) — bypasses cookie issues in both dev and prod
 *
 * Uses useState (not useRef) so context consumers re-render when socket is ready.
 */
export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null)
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    let s

    const connect = async () => {
      // Fetch short-lived socket token via REST (cookie auth works fine here)
      let authToken = null
      try {
        const res = await authAPI.getSocketToken()
        authToken = res.data?.data?.token
      } catch {
        // Not logged in yet or server unreachable — socket will fail gracefully
      }

      s = io(SOCKET_URL, {
        withCredentials: true,
        auth: authToken ? { token: authToken } : undefined,
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        transports: ['websocket', 'polling'],
      })

      s.on('connect', () => setConnected(true))
      s.on('disconnect', () => setConnected(false))
      s.on('connect_error', () => setConnected(false))

      setSocket(s)
    }

    connect()

    return () => {
      if (s) {
        s.disconnect()
        setSocket(null)
      }
    }
  }, [])

  return (
    <SocketContext.Provider value={{ socket, connected }}>
      {children}
    </SocketContext.Provider>
  )
}
