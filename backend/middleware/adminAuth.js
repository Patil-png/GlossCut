const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

module.exports = async function (req, res, next) {
  // Get token from header
  const token = req.header('x-auth-token');

  // Check if not token
  if (!token) {
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  // Verify token
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    req.admin = await Admin.findById(decoded.admin.id).select('-password');
    if (!req.admin) {
      return res.status(401).json({ msg: 'Admin not found, authorization denied' });
    }
    if (!req.admin.isActive) {
      return res.status(401).json({ msg: 'Admin account is inactive' });
    }
    next();
  } catch (err) {
    res.status(401).json({ msg: 'Token is not valid' });
  }
};
