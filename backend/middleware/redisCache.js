const redisClient = require('../redisClient');

/**
 * Express middleware to aggressively cache JSON responses using Redis.
 * Extremely fail-safe: if Redis goes down, traffic routes back to MongoDB.
 * 
 * @param {number} duration - Cache TTL in seconds
 */
const cache = (duration) => {
  return async (req, res, next) => {
    // 1. Bypass cache if Redis is not ready or connected
    if (!redisClient.isReady) {
      return next();
    }

    // 2. Create deterministic key from URL + Query String
    const key = `cache:${req.originalUrl || req.url}`;

    try {
      const cachedData = await redisClient.get(key);
      
      if (cachedData) {
        // Cache HIT: Send data instantly from RAM (Sub-millisecond)
        return res.json(JSON.parse(cachedData));
      } else {
        // Cache MISS: Intercept the final `res.json` call from the controller
        res.originalJson = res.json;
        res.json = (body) => {
          // Only cache successful responses (HTTP 2xx)
          if (res.statusCode >= 200 && res.statusCode < 300) {
            redisClient.setEx(key, duration, JSON.stringify(body))
              .catch(err => console.error('Redis SetEx Error:', err.message));
          }
          // Restore original function and send response
          res.originalJson(body);
        };
        next();
      }
    } catch (error) {
      console.error('Redis Middleware Error:', error.message);
      // Non-blocking fault tolerance: Let the request pass through to MongoDB
      next();
    }
  };
};

module.exports = cache;
