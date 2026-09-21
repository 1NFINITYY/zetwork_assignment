require('dotenv').config();

const env = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  MONGO_URI: process.env.MONGO_URI,
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  // The deployed Render URL — used by the self-ping keep-alive to prevent
  // the free-tier service from sleeping after 15 minutes of inactivity.
  RENDER_EXTERNAL_URL: process.env.RENDER_EXTERNAL_URL || null,
};

// Validate required env vars at startup
const required = ['MONGO_URI', 'JWT_SECRET'];
for (const key of required) {
  if (!env[key]) {
    throw new Error(`Missing required environment variable: ${key}. Check your .env file.`);
  }
}

module.exports = env;
