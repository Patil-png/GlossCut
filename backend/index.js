const express = require('express');
const mongoose = require('mongoose');
const http = require('http');
const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const path = require('path');
const helmet = require('helmet'); // OPTIMIZATION: Security Headers
const cluster = require('cluster'); // OPTIMIZATION: Multi-core processing
const os = require('os');

require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const startBookingScheduler = require('./utils/bookingScheduler');
const startNotificationCleaner = require('./utils/notificationCleaner');
const { scheduleDailyReset } = require('./utils/dailyReset');

// --- OPTIMIZATION: Cluster Mode (Uncomment for Production) ---
// This allows your app to use ALL CPU cores, not just one.
/*
const numCPUs = os.cpus().length;
if (cluster.isMaster && process.env.NODE_ENV === 'production') {
  console.log(`Master ${process.pid} is running`);
  // Fork workers.
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }
  cluster.on('exit', (worker, code, signal) => {
    console.log(`worker ${worker.process.pid} died`);
    cluster.fork(); // Restart worker if it crashes
  });
  return;
}
*/

const app = express();
const server = http.createServer(app);

// OPTIMIZATION: Security Headers (Protect against XSS, Sniffing)
app.use(helmet({
  crossOriginResourcePolicy: false, // Allow loading images from cross-origin
}));

// OPTIMIZATION: Socket.IO Config
const io = socketIo(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
  transports: ['websocket', 'polling'], // Websocket first for speed
  pingTimeout: 30000, // Reduced slightly to detect disconnects faster
  pingInterval: 25000,
});

const port = process.env.PORT || 3000;

// --- 1. Database Connection ---
mongoose.connect(process.env.MONGO_URI, {
  maxPoolSize: 50, // INCREASED: 10 is too low for mass market. 50 is standard.
  serverSelectionTimeoutMS: 5000, // Fail fast (5s) so the app doesn't hang
  socketTimeoutMS: 45000,
  family: 4,
})
  .then(() => {
    console.log('✅ MongoDB Connected (Pool Size: 50)');
    
    // Only run schedulers on the Master process or a single instance
    // to avoid running jobs multiple times if you scale later.
    startBookingScheduler();
    startNotificationCleaner();
    scheduleDailyReset();

    // Setup DB Indexes
    try {
      const earningsRoute = require('./routes/earnings');
      if (earningsRoute.setupDatabaseIndexes) earningsRoute.setupDatabaseIndexes();
    } catch (e) { console.log('Earnings route optional setup skipped'); }
  })
  .catch(err => {
    console.error('❌ DB Error:', err.message);
    process.exit(1);
  });

// --- 2. Compression & Parsers ---
app.use(compression({ level: 6 }));
app.use(cors());
app.use(express.json({ limit: '10mb' })); 

// --- 3. Rate Limiting ---
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 2000, // Reasonable limit for general API
  standardHeaders: true,
  legacyHeaders: false,
  // OPTIMIZATION: Skip rate limiting for trusted internal IPs or specific routes if needed
});

const bookingLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100, // 100 bookings per minute per IP is plenty. 10,000 was dangerous.
  message: 'Booking request limit reached, please wait.',
});

app.use('/api/', apiLimiter);
app.use('/api/booking', bookingLimiter);

// --- 4. Static Files (Optimized Caching) ---
// Node is bad at serving files. We add "Cache-Control" so browsers save them 
// and don't ask the server again for 1 day (86400000 ms).
const staticOptions = {
  maxAge: '1d', // Cache for 1 day
  immutable: true, // File wont change
  etag: true
};

app.use('/Uploads', express.static(path.join(__dirname, '../barber-app/Uploads'), staticOptions));
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), staticOptions));

// --- 5. Routes ---
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

// --- 6. Socket.IO Logic ---
io.on('connection', (socket) => {
  // OPTIMIZATION: Lightweight Auth
  // Do not query DB here. Just verify token.
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
    // Standardize room name: "smallerID-largerID"
    // This ensures UserA->UserB and UserB->UserA join the SAME room
    const roomName = [userId, receiverId].sort().join('-'); 
    socket.join(roomName);
  });

  socket.on('sendMessage', (messageData) => {
    const { sender, receiver } = messageData;
    const roomName = [sender, receiver].sort().join('-');
    // Broadcast to the room
    io.to(roomName).emit('message', messageData);
  });

  // Cleanup is handled automatically by Socket.io on disconnect
});

app.set('io', io);

// --- 7. Server Start ---
server.listen(port, () => {
  console.log(`🚀 Server running on port: ${port} | Env: ${process.env.NODE_ENV || 'development'}`);
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('🔥 Server Error:', err.stack);
  res.status(500).json({ msg: 'Internal Server Error' });
});