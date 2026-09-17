import axios from 'axios'

// Base axios instance
const api = axios.create({
  baseURL: '/api/v1',
  withCredentials: true, // Send HTTP-only cookies with every request
  headers: { 'Content-Type': 'application/json' },
})

// ─── Response Interceptor ──────────────────────────────────────────────────
// Automatically redirect to login on 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Don't redirect if already on auth pages
      if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

// ─── Auth API ──────────────────────────────────────────────────────────────
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
}

// ─── Account API ───────────────────────────────────────────────────────────
export const accountAPI = {
  getMyAccount: () => api.get('/accounts/me'),
  getAccountByNumber: (accountNumber) => api.get(`/accounts/${accountNumber}`),
}

// ─── Transfer API ──────────────────────────────────────────────────────────
export const transferAPI = {
  transfer: (data, idempotencyKey = null) => {
    const headers = {}
    if (idempotencyKey) {
      headers['Idempotency-Key'] = idempotencyKey
    }
    return api.post('/transfers', data, { headers })
  },
}

// ─── Transaction API ───────────────────────────────────────────────────────
export const transactionAPI = {
  getTransactions: (page = 1, limit = 20) =>
    api.get('/transactions', { params: { page, limit } }),
  getTransactionById: (transactionId) => api.get(`/transactions/${transactionId}`),
}

export default api
