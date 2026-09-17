import axios from 'axios'

// Base axios instance
const api = axios.create({
  baseURL: '/api/v1',
  withCredentials: true, // Send HTTP-only cookies with every request
  headers: { 'Content-Type': 'application/json' },
})

// Holds a reference to the ServerStatusContext's markServerWaking function.
// Injected at app startup via setServerWakingCallback() so we don't create
// a circular dependency between api.js and the React context.
let _markServerWaking = null
export function setServerWakingCallback(fn) {
  _markServerWaking = fn
}

// ─── Response Interceptor ──────────────────────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status

    // Server is down/sleeping when:
    //  - No response at all (pure network error / timeout)
    //  - 502 Bad Gateway (Vite proxy couldn't reach backend)
    //  - 503 Service Unavailable (Render cold start / overloaded)
    //  - 504 Gateway Timeout
    const isServerDown = !error.response || status === 502 || status === 503 || status === 504
    if (isServerDown && _markServerWaking) {
      _markServerWaking()
    }

    // 401 = session expired — redirect to login
    if (status === 401) {
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
  getSocketToken: () => api.get('/auth/socket-token'),
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
