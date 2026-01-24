const express = require('express');
const mongoose = require('mongoose');
const http = require('http');
const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const path = require('path');
const helmet = require('helmet');
const hpp = require('hpp');
const passport = require('passport');

// Import Configs
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const sessionConfig = require('./config/session');
require('./config/passport');

// Import Schedulers
const startBookingScheduler = require('./utils/bookingScheduler');
const startNotificationCleaner = require('./utils/notificationCleaner');
const { scheduleDailyReset } = require('./utils/dailyReset');
const logger = require('./utils/logger'); // Import Logger

const app = express();
app.set('trust proxy', 1); // Trust proxy for accurate IP detection (required for Render.com)
const server = http.createServer(app);

// ============================================================================
// 1. INITIALIZE SOCKET.IO
// ============================================================================

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3002',
  'http://192.168.29.243:3001',
  'http://192.168.29.243:3002',
  'http://192.168.29.243:3003',
  'https://glosscut.onrender.com',
  'https://glosscut.com',
  'https://www.glosscut.com',
  'https://api.glosscut.com',
];

const io = socketIo(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
  }
});

// ============================================================================
// 2. SECURITY & BASIC MIDDLEWARE
// ============================================================================

// A. Security Headers
app.use(helmet({
  crossOriginResourcePolicy: false,
  contentSecurityPolicy: {
    useDefaults: true,
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "https://apis.google.com"],
      connectSrc: ["'self'", "https://apis.google.com", "ws:", "wss:"],
      imgSrc: ["'self'", "data:", "https://*.r2.cloudflarestorage.com"],
      styleSrc: ["'self'", "'unsafe-inline'"],
    },
  },
}));

// B. CORS
app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE']
}));

// C. Body Parsing (MUST BE BEFORE SANITIZATION)
app.use(compression({ level: 6 }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' })); // Added for better form handling

// D. Custom Data Sanitization (Replaces express-mongo-sanitize)
// This manually removes '$' and '.' from inputs to prevent NoSQL injection
// It modifies objects in-place to avoid the "Cannot set property query" crash
app.use((req, res, next) => {
  const clean = (obj) => {
    if (!obj || typeof obj !== 'object') return;
    for (let key in obj) {
      if (key.startsWith('$') || key.includes('.')) {
        delete obj[key];
      } else {
        clean(obj[key]);
      }
    }
  };

  if (req.body) clean(req.body);
  if (req.params) clean(req.params);
  // We sanitize query safely without reassigning the variable
  if (req.query) clean(req.query);

  next();
});

// E. HTTP Parameter Pollution (After parsing)
app.use(hpp());

// F. Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: 'Too many requests from this IP, please try again after 15 minutes',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', limiter);

// ============================================================================
// NEW: Request Logging Middleware
// ============================================================================
app.use((req, res, next) => {
  const start = Date.now();

  // Listen for response finish to calculate duration
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('Request Completed', {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      // Only log body for non-GET requests to avoid clutter
      body: req.method !== 'GET' ? req.body : undefined
    });
  });

  next();
});

// ============================================================================
// 3. AUTHENTICATION & SESSION MIDDLEWARE
// ============================================================================

app.use(sessionConfig);
app.use(passport.initialize());
app.use(passport.session());

// ============================================================================
// 4. AUDIT MIDDLEWARE
// ============================================================================

const { auditContext } = require('./middleware/auditContext');
app.use(auditContext);

// ============================================================================
// 5. DATABASE CONNECTION
// ============================================================================

mongoose.connect(process.env.MONGO_URI, {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  family: 4,
})
  .then(() => {
    console.log('✅ MongoDB Connected (Pool Size: 50)');

    startBookingScheduler();
    startNotificationCleaner();
    scheduleDailyReset();

    try {
      const earningsRoute = require('./routes/earnings');
      if (earningsRoute.setupDatabaseIndexes) earningsRoute.setupDatabaseIndexes();
    } catch (e) { console.log('Earnings route optional setup skipped'); }
  })
  .catch(err => {
    console.error('❌ DB Error:', err.message);
    process.exit(1);
  });

// ============================================================================
// 6. STATIC FILES & SPECIFIC LIMITERS
// ============================================================================

const bookingLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: 'Booking request limit reached, please wait.',
});
app.use('/api/booking', bookingLimiter);

// ============================================================================
// NEW: Data Security Centric Limiters
// ============================================================================

// 1. Anti-Credential Stuffing (Login Limiter)
// Prevents Brute Force attacks on user accounts
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Strict limit: 10 attempts per 15 mins
  message: 'Too many login attempts. Please try again after 15 minutes.',
  standardHeaders: true,
  legacyHeaders: false,
});
// Apply to both Customer and Barber login routes
app.use(['/api/auth/login', '/api/auth/barber/login'], loginLimiter);

// 2. Anti-Enumeration (Sensitive Action Limiter)
// Prevents scanning for valid emails via Forgot Password
const sensitiveLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // Strict limit: 5 requests per hour
  message: 'Too many requests for this secure endpoint. Please try again after 1 hour.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(['/api/auth/forgot-password', '/api/auth/reset-password'], sensitiveLimiter);

const staticOptions = {
  maxAge: '1d',
  immutable: true,
  etag: true
};
app.use('/Uploads', express.static(path.join(__dirname, '../barber-app/Uploads'), staticOptions));
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), staticOptions));

// ============================================================================
// 7. ROUTES
// ============================================================================

app.use('/api/auth', require('./routes/auth'));
app.use('/api/shop', require('./routes/shop'));
app.use('/api/barber-card', require('./routes/barberCard'));
app.use('/api/liked-barbers', require('./routes/likedBarbers'));
app.use('/api/password', require('./routes/password'));
app.use('/api/payment', require('./routes/payment'));
app.use('/api/booking', require('./routes/booking'));
app.use('/api/review', require('./routes/review'));
app.use('/api/ads', require('./routes/ad'));
app.use('/api/earnings', require('./routes/earnings'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/test', require('./routes/test'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/compliance', require('./routes/compliance'));
app.use('/api/user', require('./routes/user'));
app.use('/api/exclusive-deals', require('./routes/exclusiveDeals'));
app.use('/api/admin/auth', require('./routes/adminAuth'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/images', require('./routes/images'));
app.use('/api/services', require('./routes/services')); // Public Services Route

// ============================================================================
// 8. SOCKET.IO LOGIC
// ============================================================================

io.on('connection', (socket) => {
  const token = socket.handshake.query.token;
  if (!token) return socket.disconnect();

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.user.id;
    socket.join(`user_${socket.userId}`);
  } catch (err) {
    return socket.disconnect();
  }

  socket.on('joinChat', ({ userId, receiverId }) => {
    const roomName = [userId, receiverId].sort().join('-');
    socket.join(roomName);
  });

  socket.on('sendMessage', (messageData) => {
    const { sender, receiver } = messageData;
    const roomName = [sender, receiver].sort().join('-');
    io.to(roomName).emit('message', messageData);
  });
});

app.set('io', io);

// ============================================================================
// 9. SERVER START
// ============================================================================

const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log(`🚀 Server running on port: ${port} | Env: ${process.env.NODE_ENV || 'development'}`);
});

app.use((err, req, res, next) => {
  console.error('🔥 Server Error:', err.stack);
  res.status(500).json({ msg: 'Internal Server Error' });
});
