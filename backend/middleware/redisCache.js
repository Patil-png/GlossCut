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
    let key = `cache:${req.originalUrl || req.url}`;

    // SMART CACHING FIX: Highly precise GPS coordinates change on every request, 
    // causing 100% cache misses. We round them to 3 decimals (~110m radius) 
    // so users in the same neighborhood hit the same cache bucket!
    if (req.query && (req.query.userLat || req.query.userLng || req.query.lat || req.query.lng)) {
      const baseUrl = (req.originalUrl || req.url).split('?')[0];
      const safeQuery = { ...req.query };
      
      if (safeQuery.userLat) safeQuery.userLat = parseFloat(safeQuery.userLat).toFixed(3);
      if (safeQuery.userLng) safeQuery.userLng = parseFloat(safeQuery.userLng).toFixed(3);
      if (safeQuery.lat) safeQuery.lat = parseFloat(safeQuery.lat).toFixed(3);
      if (safeQuery.lng) safeQuery.lng = parseFloat(safeQuery.lng).toFixed(3);

      const sortedParams = Object.keys(safeQuery).sort().map(k => `${k}=${safeQuery[k]}`).join('&');
      key = `cache:${baseUrl}?${sortedParams}`;
    }

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
