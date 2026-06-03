require('dotenv').config();
const path = require('path');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const session = require('express-session');
const passport = require('./config/passport');

const app = express();

// ── Global Exception & Rejection Handlers (prevents random crashes) ───────────
process.on('uncaughtException', (err) => {
  console.error('❌ UNCAUGHT EXCEPTION:', err);
  console.error(err.stack);
  // Log and continue — don't crash the whole process for a single request error
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ UNHANDLED REJECTION at:', promise, 'reason:', reason);
});

// ── Graceful shutdown helper ─────────────────────────────────────────────────
function gracefulShutdown(signal) {
  console.log(`\n${signal} received — shutting down gracefully...`);
  const timeout = setTimeout(() => {
    console.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000); // 10 second timeout

  timeout.unref();

  mongoose.connection.close(false).then(() => {
    console.log('MongoDB connections closed');
    clearTimeout(timeout);
    process.exit(0);
  }).catch((err) => {
    console.error('Error closing MongoDB:', err);
    clearTimeout(timeout);
    process.exit(1);
  });
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// ── Security: Validate required environment variables ─────────────────────────
const requiredEnvVars = ['MONGODB_URI', 'JWT_SECRET'];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`FATAL: Missing required environment variable: ${envVar}`);
    process.exit(1);
  }
}

// ── Security: Restricted CORS ────────────────────────────────────────────────
const allowedOrigins = [
  process.env.CLIENT_URL,
  'http://localhost:3000',
  'http://localhost:3001',
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// ── Rate limiting ────────────────────────────────────────────────────────────
const rateLimit = require('./middleware/rateLimit');
app.use('/api/auth', rateLimit({ windowMs: 15 * 60 * 1000, max: 20 }));
app.use('/api/ai', rateLimit({ windowMs: 60 * 1000, max: 10 }));
app.use('/api/questions', rateLimit({ windowMs: 60 * 1000, max: 30 }));

app.use(express.json({ limit: '1mb' }));
app.use(session({
  secret: process.env.JWT_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000
  }
}));
app.use(passport.initialize());
app.use(passport.session());

// ── Database connection with monitoring ───────────────────────────────────────
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000,
  heartbeatFrequencyMS: 10000,
})
.then(() => console.log('✅ MongoDB connected'))
.catch(err => {
  console.error('❌ MongoDB connection error:', err);
  process.exit(1);
});

mongoose.connection.on('disconnected', () => {
  console.warn('⚠️ MongoDB disconnected — will auto-reconnect');
});

mongoose.connection.on('reconnected', () => {
  console.log('✅ MongoDB reconnected');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB error:', err.message);
});

// ── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth', require('./routes/auth'));
app.use('/api/questions', require('./routes/questions'));
app.use('/api/answers', require('./routes/answers'));
app.use('/api/comments', require('./routes/comments'));
app.use('/api/tags', require('./routes/tags'));
app.use('/api/users', require('./routes/users'));
app.use('/api/guru', require('./routes/guru'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/bounties', require('./routes/bounties'));
app.use('/api/shlokas', require('./routes/shlokas'));
app.use('/api/home', require('./routes/home'));

// ── Health check (includes DB status) ─────────────────────────────────────────
app.get('/api/health', (req, res) => {
  const mongoState = mongoose.connection.readyState;
  const stateMap = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };
  res.json({
    status: mongoState === 1 ? 'ok' : 'degraded',
    mongodb: stateMap[mongoState] || 'unknown',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// ── Serve client build in production ─────────────────────────────────────────
if (process.env.NODE_ENV === 'production') {
  const clientBuild = path.join(__dirname, '..', 'client', 'build');
  app.use(express.static(clientBuild));
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientBuild, 'index.html'));
  });
}

// ── 404 handler for /api only ────────────────────────────────────────────────
app.use('/api/*', (req, res) => {
  res.status(404).json({ message: 'API endpoint not found' });
});

// ── Error handling middleware ─────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({ message: 'CORS policy violation' });
  }
  res.status(500).json({ message: 'Something went wrong!' });
});

// ── Start server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

// Handle server-level errors (EADDRINUSE, etc.)
server.on('error', (err) => {
  console.error('❌ Server error:', err.message);
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Try using a different port.`);
  }
  process.exit(1);
});
