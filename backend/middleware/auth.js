const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * JWT Authentication Middleware (Legacy Support)
 * For API endpoints that still use JWT tokens
 */
const jwtAuth = async function (req, res, next) {
  // Get token from header (support both x-auth-token and Authorization: Bearer <token>)
  // Also accept a token via query param (useful for immediate deep-link requests)
  const token = req.header('x-auth-token') || (req.headers.authorization && req.headers.authorization.split(' ')[1]) || req.query?.token;

  console.log('JWT Auth middleware called');
  console.log('Token present:', !!token);
  if (token) {
    // Log a short prefix (avoid printing full token in prod)
    console.log('Token prefix:', `${token.slice(0, 10)}...`);
    // Log what channel provided it for debugging
    console.log('Token source: ', req.header('x-auth-token') ? 'x-auth-token' : (req.headers.authorization ? 'Authorization' : (req.query?.token ? 'query' : 'none')));
  }

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
    // 1. Try JWT auth FIRST (header or Authorization or query param)
    // This priority ensures that explicit tokens (Mobile App) override implicit sessions (Web Cookies)
    const token = req.header('x-auth-token') || (req.headers.authorization && req.headers.authorization.split(' ')[1]) || req.query?.token;

    if (token) {
      try {
        console.log('OptionalAuth: token prefix', `${token.slice(0, 10)}...`);
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
        console.log('OptionalAuth: token decoded', { id: decoded?.user?.id });
        const user = await User.findById(decoded.user.id).select('-password');

        if (user) {
          req.user = user;
          console.log('OptionalAuth: user loaded via JWT', user.email);
          return next();
        }
      } catch (err) {
        // JWT invalid, but that's okay for optional auth - fall through to session
        console.log('Optional JWT auth failed, falling back to session:', err.message);
      }
    }

    // 2. Try session auth if JWT failed or wasn't present
    if (req.isAuthenticated && req.isAuthenticated()) {
      console.log('OptionalAuth: user loaded via Session', req.user?.email);
      return next();
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
