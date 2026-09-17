import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import axios from 'axios'
import { setServerWakingCallback } from '../services/api'

/**
 * ServerStatusContext
 *
 * Two jobs:
 *  1. KEEP-ALIVE: Ping /health every 10 minutes so Render free tier
 *     doesn't spin down the server due to inactivity.
 *
 *  2. WAKING DETECTION: If any API call fails with a network error
 *     (no response = server is sleeping), this context detects it and
 *     shows a "Server is waking up" screen with auto-retry every 8 seconds.
 */

const KEEP_ALIVE_INTERVAL = 10 * 60 * 1000  // 10 minutes
const RETRY_INTERVAL = 8 * 1000             // 8 seconds when waking

export const ServerStatusContext = createContext(null)

export function ServerStatusProvider({ children }) {
  const [status, setStatus] = useState('ONLINE') // 'ONLINE' | 'WAKING'
  const retryTimer = useRef(null)
  const keepAliveTimer = useRef(null)

  const pingHealth = useCallback(async () => {
    try {
      await axios.get('/health', { timeout: 8000 })
      return true
    } catch {
      return false
    }
  }, [])

  const markServerWaking = useCallback(() => {
    setStatus((prev) => (prev === 'WAKING' ? prev : 'WAKING'))
  }, [])

  // Register synchronously during render — before children (AuthContext) mount
  // so the callback is ready when the first /auth/me request fires
  setServerWakingCallback(markServerWaking)

  // Auto-retry loop when server is waking
  useEffect(() => {
    if (status !== 'WAKING') return

    const poll = async () => {
      const alive = await pingHealth()
      if (alive) {
        setStatus('ONLINE')
      } else {
        retryTimer.current = setTimeout(poll, RETRY_INTERVAL)
      }
    }

    // Start polling immediately
    poll()

    return () => {
      if (retryTimer.current) clearTimeout(retryTimer.current)
    }
  }, [status, pingHealth])

  // Keep-alive ping every 10 minutes when server is ONLINE
  useEffect(() => {
    if (status !== 'ONLINE') return

    keepAliveTimer.current = setInterval(async () => {
      const alive = await pingHealth()
      if (!alive) markServerWaking()
    }, KEEP_ALIVE_INTERVAL)

    return () => {
      if (keepAliveTimer.current) clearInterval(keepAliveTimer.current)
    }
  }, [status, pingHealth, markServerWaking])

  return (
    <ServerStatusContext.Provider value={{ status, markServerWaking }}>
      {children}
    </ServerStatusContext.Provider>
  )
}
