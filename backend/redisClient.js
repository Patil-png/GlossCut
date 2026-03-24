const { createClient } = require('redis');

let redisClient;
try {
  redisClient = createClient({
    url: process.env.REDIS_URL || 'redis://127.0.0.1:6379',
    socket: {
      reconnectStrategy: false // Prevents infinite retry spam if Redis isn't running
    }
  });
} catch (err) {
  console.error('FATAL: Invalid REDIS_URL syntax provided. Redis client creation failed.', err.message);
  // Stub client object to safely handle cache bypass without crashing routes
  redisClient = { isReady: false, on: () => {}, connect: async () => {}, get: async () => null, setEx: async () => {} };
}

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
