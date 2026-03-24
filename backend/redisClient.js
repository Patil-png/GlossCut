const { createClient } = require('redis');

const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://127.0.0.1:6379',
  socket: {
    reconnectStrategy: false // Prevents infinite retry spam if Redis isn't running
  }
});

let errorLogged = false;
redisClient.on('error', (err) => {
  // Only log the error once to prevent console spam
  if (!errorLogged) {
    console.warn('⚠️ Redis not found locally. Caching will be gracefully bypassed.');
    errorLogged = true;
  }
});

redisClient.on('connect', () => {
  console.log('Successfully connected to Redis');
});

// Soft-connect on boot so the app doesn't crash if Redis is unavailable
(async () => {
  try {
    await redisClient.connect();
  } catch (err) {
    console.error('Failed to connect to Redis on startup. Caching will be bypassed:', err.message);
  }
})();

module.exports = redisClient;
