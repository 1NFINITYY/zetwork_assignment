import { createContext, useEffect, useState } from 'react'
import { io } from 'socket.io-client'
import { authAPI } from '../services/api'

export const SocketContext = createContext(null)

/**
 * SocketProvider
 *
 * Connects to Socket.IO server. Auth strategy:
 *  1. Cookie (sameSite: lax) — works in production and direct connections.
 *  2. handshake auth token — fallback for dev (Vite WS proxy strips cookies).
 *     Fetches a short-lived (60s) token via GET /api/v1/auth/socket-token
 *     and passes it in io({ auth: { token } }).
 *
 * Uses useState (not useRef) so context consumers re-render when socket is ready.
 */
export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null)
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    let s

    const connect = async () => {
      // Fetch a short-lived socket token via REST (cookies work fine here)
      let authToken = null
      try {
        const res = await authAPI.getSocketToken()
        authToken = res.data?.data?.token
      } catch {
        // Not logged in yet, or server down — socket will fail gracefully
      }

      s = io(window.location.origin, {
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
