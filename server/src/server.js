const http = require('http')
const app = require('./app')
const connectDB = require('./config/db')
const env = require('./config/env')
const { initSocket } = require('./sockets/socket')

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
  })
}

startServer()
