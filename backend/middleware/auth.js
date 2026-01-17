const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * JWT Authentication Middleware (Legacy Support)
 * For API endpoints that still use JWT tokens
 */
const jwtAuth = async function (req, res, next) {
  // Get token from header
  const token = req.header('x-auth-token');

  console.log('JWT Auth middleware called');
  console.log('Token present:', !!token);

  // Check if not token
  if (!token) {
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  // Verify token
  try {
    console.log('Verifying token...');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    console.log('Token decoded successfully:', decoded);

    req.user = await User.findById(decoded.user.id).select('-password');
    console.log('User found:', !!req.user);

    if (!req.user) {
      return res.status(401).json({ msg: 'User not found, authorization denied' });
    }

    console.log('JWT auth middleware passed for user:', req.user.email);
    next();
  } catch (err) {
    console.error('JWT auth middleware error:', err.message);
    return res.status(401).json({ msg: 'Token is not valid' });
  }
};

/**
 * Session Authentication Middleware
 * For OAuth and session-based authentication
 */
const sessionAuth = (req, res, next) => {
  console.log('Session auth middleware called');
  console.log('Session present:', !!req.session);
  console.log('User in session:', !!req.user);

  if (req.isAuthenticated && req.isAuthenticated()) {
    console.log('Session auth passed for user:', req.user?.email);
    return next();
  }

  console.log('Session auth failed - no authenticated session');
  return res.status(401).json({ error: 'Authentication required' });
};

/**
 * Optional Authentication Middleware
 * Gets user if exists, but doesn't require authentication
 */
const optionalAuth = async (req, res, next) => {
  try {
    // Try session auth first
    if (req.isAuthenticated && req.isAuthenticated()) {
      return next();
    }

    // Try JWT auth
    const token = req.header('x-auth-token');
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
        req.user = await User.findById(decoded.user.id).select('-password');
      } catch (err) {
        // JWT invalid, but that's okay for optional auth
        console.log('Optional JWT auth failed, continuing without user');
      }
    }

    // No auth required, continue
    next();
  } catch (err) {
    console.error('Optional auth error:', err.message);
    next(); // Continue without user
  }
};

/**
 * Admin Authentication Middleware
 * Requires authentication + admin role
 */
const adminAuth = (req, res, next) => {
  // First check authentication
  if (!(req.isAuthenticated && req.isAuthenticated())) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  // Then check admin role
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  next();
};

// Legacy export for backward compatibility
module.exports = jwtAuth;

// Named exports for new functionality
module.exports.jwtAuth = jwtAuth;
module.exports.sessionAuth = sessionAuth;
module.exports.optionalAuth = optionalAuth;
module.exports.adminAuth = adminAuth;
module.exports.isAuthenticated = sessionAuth; // Alias for session auth
module.exports.isAdmin = adminAuth; // Alias for admin auth
