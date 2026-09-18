const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const env = require('./config/env');
const errorHandler = require('./middleware/errorHandler');
const { generalLimiter } = require('./middleware/rateLimiter');

// Route imports
const authRoutes = require('./routes/authRoutes');
const accountRoutes = require('./routes/accountRoutes');
const transferRoutes = require('./routes/transferRoutes');
const transactionRoutes = require('./routes/transactionRoutes');

const app = express();

// ─── Trust Proxy (required on Render / cloud platforms) ──────────────────────
// Render sits behind a reverse proxy that sets X-Forwarded-For.
// Without this, express-rate-limit cannot identify real client IPs.
app.set('trust proxy', 1);

// ─── Security Headers (spec section 17) ─────────────────────────────────────
app.use(helmet());

// ─── CORS (spec section 17) ──────────────────────────────────────────────────
// In production: frontend (Vercel) and backend (Render) are different domains.
// CLIENT_ORIGINS is a parsed list so multiple Vercel URLs are all allowed.
const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. curl, Postman, server-to-server)
    if (!origin) return callback(null, true);
    if (env.CLIENT_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS: origin '${origin}' not allowed`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Idempotency-Key'],
  exposedHeaders: ['Set-Cookie'],
};

app.use(cors(corsOptions));

// Ensure preflight OPTIONS requests are handled
app.options('*', cors(corsOptions));

// ─── Body Parsing ────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10kb' })); // Prevent large payloads
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ─── Global Rate Limiter ─────────────────────────────────────────────────────
app.use('/api', generalLimiter);

// ─── Health Check ────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ success: true, message: 'Banking API is running', timestamp: new Date().toISOString() });
});

// ─── API Routes (versioned) ──────────────────────────────────────────────────
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/accounts', accountRoutes);
app.use('/api/v1/transfers', transferRoutes);
app.use('/api/v1/transactions', transactionRoutes);

// ─── 404 Handler ─────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.path} not found`,
    code: 'NOT_FOUND',
  });
});

// ─── Centralized Error Handler (must be last) ────────────────────────────────
app.use(errorHandler);

module.exports = app;
