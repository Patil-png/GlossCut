const express = require('express');
const mongoose = require('mongoose');
const http = require('http');
const socketIo = require('socket.io');
const jwt = require('jsonwebtoken'); // Import jsonwebtoken
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const path = require('path'); // Ensure path is imported if not already
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const startBookingScheduler = require('./utils/bookingScheduler');
const startNotificationCleaner = require('./utils/notificationCleaner'); // Import the notification cleaner
const { scheduleDailyReset } = require('./utils/dailyReset'); // Import the daily reset scheduler

const app = express();
app.set('trust proxy', true); // Trust proxy for accurate IP detection with rate limiting
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: '*', // Allow all origins
    methods: ['GET', 'POST'],
  },
  // Optimize Socket.IO for performance
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000,
});
const port = process.env.PORT || 3000;

// Ultra-optimized MongoDB connection with connection pooling
mongoose.connect(process.env.MONGO_URI, {
  maxPoolSize: 10, // Maintain up to 10 socket connections
  serverSelectionTimeoutMS: 10000, // Keep trying to send operations for 10 seconds
  socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
  bufferCommands: false, // Disable mongoose buffering
  maxIdleTimeMS: 30000, // Close connections after 30 seconds of inactivity
  family: 4, // Use IPv4, skip trying IPv6
  // Additional options for MongoDB Atlas/cloud connections
  retryWrites: true,
  retryReads: true,
  w: 'majority',
  readPreference: 'primaryPreferred'
})
  .then(() => {
    console.log('✅ MongoDB Connected with optimized connection pooling');
    console.log('📍 Connected to:', process.env.MONGO_URI);
    startBookingScheduler(); // Start the booking scheduler after DB connection
    startNotificationCleaner(); // Start the notification cleaner after DB connection
    scheduleDailyReset(); // Start the daily reset scheduler after DB connection
  })
  .catch(err => {
    console.error('❌ MongoDB Connection Error:', err.message);
    console.error('🔍 Please check your MONGO_URI in .env file');
    console.error('💡 Make sure MongoDB is running locally or use cloud URI');
    process.exit(1); // Exit if DB connection fails
  });

// Enable gzip compression for all responses (saves bandwidth)
app.use(compression({
  level: 6, // Good balance between compression and speed
  threshold: 1024, // Only compress responses larger than 1KB
  filter: (req, res) => {
    // Don't compress responses with this request header
    if (req.headers['x-no-compression']) {
      return false;
    }
    // Use compression filter function
    return compression.filter(req, res);
  }
}));

app.use(cors());
app.use(express.json({ limit: '10mb' })); // Limit payload size for security

// Rate limiting to prevent abuse and reduce server load
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 10000, // Limit each IP to 10000 requests per windowMs
  message: 'Too many requests from this IP, please try again after 15 minutes',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Stricter rate limiting for booking operations
const bookingLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10000, // <--- The bottleneck
  message: 'Too many booking requests, please slow down',
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting
app.use('/api/', apiLimiter);
app.use('/api/booking', bookingLimiter);

// Serve static files from the 'barber-app/Uploads' directory
app.use('/Uploads', express.static(path.join(__dirname, '../barber-app/Uploads')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

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
app.use('/api/compliance', require('./routes/compliance')); // New compliance route
app.use('/api/user', require('./routes/user'));
app.use('/api/exclusive-deals', require('./routes/exclusiveDeals'));
app.use('/api/admin/auth', require('./routes/adminAuth'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/images', require('./routes/images'));
// Face suggestor API is disabled for maintenance (unregister route)
// app.use('/api/face-suggestor', require('./routes/faceSuggestor'));

io.on('connection', (socket) => {
  console.log('a user connected');

  // Authenticate socket connection
  const token = socket.handshake.query.token;
  if (!token) {
    socket.disconnect();
    return;
  }

  let userId;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET); // Assuming JWT_SECRET is defined
    userId = decoded.user.id;
    socket.userId = userId; // Attach userId to socket for later use
    console.log(`User ${userId} connected via socket`);
  } catch (err) {
    console.error('Socket authentication failed:', err.message);
    socket.disconnect();
    return;
  }

  socket.on('joinChat', ({ userId, receiverId }) => {
    // Join a room specific to the conversation between two users
    // To ensure both sender and receiver get messages
    const roomName = [userId, receiverId].sort().join('-');
    socket.join(roomName);
    console.log(`User ${userId} joined chat room: ${roomName}`);
  });

  socket.on('sendMessage', async (messageData) => {
    try {
      // Save message to DB (already handled by API, but for real-time, we re-emit)
      // The messageData should already contain sender, receiver, message, appType, timestamp, _id
      // from the API response.
      const { sender, receiver, message, appType, _id, timestamp } = messageData;

      // Emit message to the room
      const roomName = [sender, receiver].sort().join('-');
      io.to(roomName).emit('message', messageData);
      console.log(`Message sent in room ${roomName}: ${message}`);
    } catch (err) {
      console.error('Error sending message via socket:', err.message);
    }
  });

  socket.on('disconnect', () => {
    console.log(`User ${socket.userId} disconnected`);
  });
});

app.set('io', io);

server.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
});

// Log network interfaces for easier debugging when testing from devices
const os = require('os');
const nets = os.networkInterfaces();
Object.keys(nets).forEach((name) => {
  for (const net of nets[name]) {
    // skip internal (i.e. 127.0.0.1) and non-IPv4
    if (net.family === 'IPv4' && !net.internal) {
      console.log(`Server available at: http://${net.address}:${port}`);
    }
  }
});

// Global error handler (logs stack traces and returns JSON)
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.stack || err);
  const status = err.status || 500;
  res.status(status).json({ msg: err.message || 'Server Error' });
});
