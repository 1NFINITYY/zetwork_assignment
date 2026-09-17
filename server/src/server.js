const app = require('./app');
const connectDB = require('./config/db');
const env = require('./config/env');

const startServer = async () => {
  // Connect to MongoDB first
  await connectDB();

  const PORT = env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`🚀 Banking API running on port ${PORT} in ${env.NODE_ENV} mode`);
    console.log(`   Health: http://localhost:${PORT}/health`);
    console.log(`   API:    http://localhost:${PORT}/api/v1`);
  });
};

startServer();
