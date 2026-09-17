import { useState, useEffect, useCallback } from 'react'
import { transactionAPI } from '../services/api'

export const useTransactions = (page = 1, limit = 20) => {
  const [transactions, setTransactions] = useState([])
  const [pagination, setPagination] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchTransactions = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await transactionAPI.getTransactions(page, limit)
      setTransactions(res.data.data.transactions)
      setPagination(res.data.data.pagination)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load transactions')
    } finally {
      setLoading(false)
    }
  }, [page, limit])

  useEffect(() => {
    fetchTransactions()
  }, [fetchTransactions])

  return { transactions, pagination, loading, error, refetch: fetchTransactions }
}
