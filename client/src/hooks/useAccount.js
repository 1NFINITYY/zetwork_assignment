import { useState, useEffect, useCallback } from 'react'
import { accountAPI } from '../services/api'

export const useAccount = () => {
  const [account, setAccount] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchAccount = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await accountAPI.getMyAccount()
      setAccount(res.data.data.account)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load account')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAccount()
  }, [fetchAccount])

  return { account, loading, error, refetch: fetchAccount }
}
