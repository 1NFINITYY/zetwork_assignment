const http = require('http')
const https = require('https')
const app = require('./app')
const connectDB = require('./config/db')
const env = require('./config/env')
const { initSocket } = require('./sockets/socket')

// ─── Self-Ping Keep-Alive ─────────────────────────────────────────────────────
// Keeps the server warm by pinging /health every 9 minutes.
// - On Render (production): uses RENDER_EXTERNAL_URL (set by Render automatically)
// - On localhost (dev):     falls back to http://localhost:{PORT}
// This prevents Render's free tier from spinning down after 15 min of inactivity.
const startKeepAlive = (PORT) => {
  const baseUrl = env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`
  const healthUrl = `${baseUrl}/health`
  const INTERVAL_MS = 9 * 60 * 1000 // 9 minutes

  const ping = () => {
    const client = healthUrl.startsWith('https') ? https : http
    // NOTE: http.get() already calls req.end() internally — do NOT call it again.
    // res.resume() drains the response body so the socket is released back to
    // the connection pool after every ping (prevents socket exhaustion).
    client.get(healthUrl, (res) => {
      res.resume()
      console.log(`✅ Keep-alive ping → ${healthUrl} [${res.statusCode}]`)
    }).on('error', (err) => {
      console.error(`❌ Keep-alive ping failed: ${err.message}`)
    })
  }

  // Fire once shortly after startup, then on a fixed interval
  setTimeout(ping, 5000)
  setInterval(ping, INTERVAL_MS)
  console.log(`🏓 Keep-alive scheduled every ${INTERVAL_MS / 60000} min → ${healthUrl}`)
}

const startServer = async () => {
  // Connect to MongoDB first
  await connectDB()

  const PORT = env.PORT || 5000

  // Create HTTP server from Express app (spec §3 — Socket.IO attaches to same server)
  const httpServer = http.createServer(app)

  // Initialize Socket.IO on the HTTP server
  initSocket(httpServer)

  httpServer.listen(PORT, () => {
    console.log(`🚀 Banking API running on port ${PORT} in ${env.NODE_ENV} mode`)
    console.log(`   Health: http://localhost:${PORT}/health`)
    console.log(`   API:    http://localhost:${PORT}/api/v1`)
    console.log(`   WS:     ws://localhost:${PORT}/socket.io`)

    // Start keep-alive after server is ready (runs in both dev and production)
    startKeepAlive(PORT)
  })
}

startServer()
