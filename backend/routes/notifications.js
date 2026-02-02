const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const schemas = require('../utils/validationSchemas');

// Ultra-efficient in-memory cache for notifications
const notificationCache = new Map();
const NOTIFICATION_CACHE_DURATION = 30 * 1000; // 30 seconds for notifications

// Cache management functions
const getNotificationCached = (key) => {
  const cached = notificationCache.get(key);
  if (cached && Date.now() - cached.timestamp < NOTIFICATION_CACHE_DURATION) {
    return cached.data;
  }
  notificationCache.delete(key);
  return null;
};

const setNotificationCached = (key, data) => {
  notificationCache.set(key, { data, timestamp: Date.now() });
  // Prevent memory leaks - limit cache size
  if (notificationCache.size > 100) {
    const firstKey = notificationCache.keys().next().value;
    notificationCache.delete(firstKey);
  }
};

// @route   GET api/notifications
// @desc    Get all notifications for the authenticated user (ultra-optimized with caching)
router.get('/', auth, async (req, res) => {
  try {
    const cacheKey = `notifications_${req.user.id}`;
    const cached = getNotificationCached(cacheKey);

    if (cached) {
      return res.json(cached);
    }

    // FIXED: Removed .lean() so Mongoose decrypts title and message automatically
    const notifications = await Notification.find({ userId: req.user.id })
      .sort({ date: -1 });

    setNotificationCached(cacheKey, notifications);
    res.json(notifications);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/notifications/:id/read
// @desc    Mark a notification as read
// @access  Private
router.put('/:id/read', auth, validate(schemas.markRead), async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({ msg: 'Notification not found' });
    }

    if (notification.userId.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'User not authorized' });
    }

    notification.read = true;
    await notification.save(); // Mongoose handles re-encryption (if needed) automatically

    // FIXED: Invalidate cache for this user so they get fresh data immediately
    const cacheKey = `notifications_${req.user.id}`;
    if (notificationCache.has(cacheKey)) {
      notificationCache.delete(cacheKey);
    }

    res.json(notification);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;