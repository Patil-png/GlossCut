const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Admin = require('../models/Admin');

/**
 * Flexible Authentication Middleware for Chat
 * Accepts both user tokens and admin tokens
 */
const chatAuth = async function (req, res, next) {
    const token = req.header('x-auth-token') ||
        (req.headers.authorization && req.headers.authorization.split(' ')[1]);

    if (!token) {
        return res.status(401).json({ msg: 'No token, authorization denied' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');

        // Check if it's an admin token
        if (decoded.admin) {
            const admin = await Admin.findById(decoded.admin.id).select('-password');
            if (!admin) {
                return res.status(401).json({ msg: 'Admin not found, authorization denied' });
            }
            // Set both req.admin and req.user for compatibility
            req.admin = admin;
            req.user = { id: admin._id, role: 'admin', ...admin.toObject() };
            return next();
        }

        // Otherwise, it's a regular user token
        if (decoded.user) {
            const user = await User.findById(decoded.user.id).select('-password');
            if (!user) {
                return res.status(401).json({ msg: 'User not found, authorization denied' });
            }
            req.user = user;
            return next();
        }

        return res.status(401).json({ msg: 'Invalid token structure' });
    } catch (err) {
        console.error('Chat auth middleware error:', err.message);
        return res.status(401).json({ msg: 'Token is not valid' });
    }
};

module.exports = chatAuth;
