const http = require('http')
const https = require('https')
const app = require('./app')
const connectDB = require('./config/db')
const env = require('./config/env')
const { initSocket } = require('./sockets/socket')

// ─── Self-Ping Keep-Alive (Render free tier) ──────────────────────────────────
// Render spins down free services after ~15 min of inactivity.
// This pings our own /health endpoint every 9 minutes to keep the server warm.
const startKeepAlive = () => {
  const renderUrl = env.RENDER_EXTERNAL_URL
  if (!renderUrl) {
    console.log('⚠️  RENDER_EXTERNAL_URL not set — self-ping keep-alive disabled.')
    return
  }

  const healthUrl = `${renderUrl}/health`
  const INTERVAL_MS = 9 * 60 * 1000 // 9 minutes (safely under Render's 15-min limit)

  const ping = () => {
    const client = healthUrl.startsWith('https') ? https : http
    const req = client.get(healthUrl, (res) => {
      console.log(`✅ Keep-alive ping → ${healthUrl} [${res.statusCode}]`)
    })
    req.on('error', (err) => {
      console.error(`❌ Keep-alive ping failed: ${err.message}`)
    })
    req.end()
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

    // Start keep-alive only after the server is actually ready
    if (env.NODE_ENV === 'production') {
      startKeepAlive()
    }
  })
}

startServer()
