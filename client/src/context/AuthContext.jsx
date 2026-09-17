import { createContext, useState, useEffect } from 'react'
import { authAPI } from '../services/api'

export const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await authAPI.me()
        setUser(res.data.data.user)
      } catch {
        setUser(null)
      } finally {
        setLoading(false)
      }
    }
    checkAuth()
  }, [])

  const register = async (data) => {
    const res = await authAPI.register(data)
    setUser(res.data.data.user)
    return res.data
  }

  const login = async (data) => {
    const res = await authAPI.login(data)
    setUser(res.data.data.user)
    return res.data
  }

  const logout = async () => {
    await authAPI.logout()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, register, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
