const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = async function (req, res, next) {
  // Get token from header
  const token = req.header('x-auth-token');

  console.log('Auth middleware called');
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

    console.log('Auth middleware passed for user:', req.user.email);
    next();
  } catch (err) {
    console.error('Auth middleware error:', err.message);
    return res.status(401).json({ msg: 'Token is not valid' });
  }
};
