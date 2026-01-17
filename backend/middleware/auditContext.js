const AuditLogger = require('./auditMiddleware');

/**
 * Express middleware to capture request details (IP, UserAgent)
 * and optionally log every API access (Good for security monitoring)
 */
const auditContext = (req, res, next) => {
  // Capture start time
  const start = Date.now();
  const originalSend = res.send;

  // Intercept response to log successful access
  res.send = function(data) {
    // Only log if it's a success (2xx) or specific errors (401/403) you want to track
    // We filter out 404s to avoid noise
    if (res.statusCode >= 200 && res.statusCode < 400) {
      const duration = Date.now() - start;
      const userId = req.user ? req.user._id : null;

      // Fire and forget (don't await)
      AuditLogger.log({
        userId,
        action: 'ACCESS',
        entity: 'API',
        changes: {
          method: req.method,
          endpoint: req.originalUrl,
          statusCode: res.statusCode,
          duration: `${duration}ms`
        },
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent')
      }).catch(() => {});
    }

    originalSend.call(this, data);
  };

  next();
};

/**
 * Helper to pass the User ID from Express Request to Mongoose Document
 * Must be called in Controllers before .save()
 * Example: setAuditUser(req, userDoc); await userDoc.save();
 */
const setAuditUser = (req, doc) => {
  if (req.user && doc) {
    // We attach it to a temporary property that the Plugin looks for
    doc._auditUserId = req.user._id;
  }
  return doc;
};

module.exports = { auditContext, setAuditUser };