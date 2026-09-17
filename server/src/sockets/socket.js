const { Server } = require('socket.io')
const jwt = require('jsonwebtoken')
const env = require('../config/env')
const User = require('../models/User')

let _io = null

/**
 * Parse a raw Cookie header string into a key-value object.
 * Avoids any dependency on the `cookie` npm package whose exports differ by version.
 * Example: "token=abc123; session=xyz" → { token: 'abc123', session: 'xyz' }
 */
function parseCookieHeader(cookieStr) {
  const result = {}
  if (!cookieStr) return result
  cookieStr.split(';').forEach((pair) => {
    const idx = pair.indexOf('=')
    if (idx < 0) return
    const key = pair.slice(0, idx).trim()
    const val = pair.slice(idx + 1).trim()
    result[key] = decodeURIComponent(val)
  })
  return result
}

/**
 * Initialize Socket.IO on the existing HTTP server (spec §3).
 *
 * Authentication (spec §4):
 *  - Reads JWT from the HTTP-only cookie sent during the WS upgrade handshake.
 *  - Falls back to socket.handshake.auth.token (used in dev via Vite proxy).
 *  - Verifies token, looks up user, attaches user to socket.
 *  - Joins the socket to a private room: "user:<userId>"
 *  - Client cannot subscribe to another user's room.
 */
function initSocket(httpServer) {
  _io = new Server(httpServer, {
    cors: {
      origin: env.CLIENT_URL || 'http://localhost:5173',
      credentials: true,
    },
  })

  // ── Authentication middleware ──────────────────────────────────────────────
  _io.use(async (socket, next) => {
    try {
      // Try cookie first (direct connections / production)
      const rawCookie = socket.handshake.headers.cookie || ''
      const cookies = parseCookieHeader(rawCookie)
      // Fall back to handshake auth token (dev: Vite WS proxy strips cookies)
      const token = cookies.token || socket.handshake.auth?.token

      if (!token) {
        return next(new Error('UNAUTHORIZED: No token provided'))
      }

      const decoded = jwt.verify(token, env.JWT_SECRET)
      const user = await User.findById(decoded.userId)
      if (!user) {
        return next(new Error('UNAUTHORIZED: User not found'))
      }

      socket.user = user
      next()
    } catch (err) {
      next(new Error('UNAUTHORIZED: Invalid token'))
    }
  })

  // ── Connection handler ─────────────────────────────────────────────────────
  _io.on('connection', (socket) => {
    const userId = socket.user._id.toString()
    const room = `user:${userId}`

    // Server assigns the room — client cannot self-assign (spec §4)
    socket.join(room)
    console.log(`🔌 Socket connected: user ${socket.user.name} → room ${room}`)

    socket.on('disconnect', (reason) => {
      console.log(`🔌 Socket disconnected: user ${socket.user.name} (${reason})`)
    })
  })

  return _io
}

/**
 * Get the initialized Socket.IO instance.
 * Throws if initSocket() hasn't been called yet.
 */
function getIO() {
  if (!_io) throw new Error('Socket.IO not initialized. Call initSocket() first.')
  return _io
}

module.exports = { initSocket, getIO }
