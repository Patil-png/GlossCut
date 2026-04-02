const crypto = require('crypto');

/**
 * Request ID Middleware
 * Assigns a unique X-Request-ID to every incoming request.
 * Included in response headers and logs for correlation.
 * Standard practice in premium startups for tracing production issues.
 */
module.exports = (req, res, next) => {
    // 1. Generate or use existing Request ID
    const requestId = req.headers['x-request-id'] || crypto.randomUUID();
    
    // 2. Attach to request object
    req.id = requestId;
    
    // 3. Set response header for client-side tracking
    res.setHeader('X-Request-ID', requestId);
    
    next();
};
