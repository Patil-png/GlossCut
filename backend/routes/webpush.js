const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');

/**
 * POST /api/webpush/subscribe
 * Saves the browser push subscription object to the authenticated user
 */
router.post('/subscribe', auth, async (req, res) => {
    try {
        const { subscription } = req.body;
        if (!subscription || !subscription.endpoint) {
            return res.status(400).json({ msg: 'Invalid subscription object' });
        }

        await User.findByIdAndUpdate(req.user.id, {
            webPushSubscription: subscription
        });

        res.json({ success: true, msg: 'Push subscription saved' });
    } catch (err) {
        console.error('Web push subscribe error:', err.message);
        res.status(500).json({ msg: 'Server error saving subscription' });
    }
});

/**
 * POST /api/webpush/unsubscribe
 * Clears the browser push subscription from the authenticated user
 */
router.post('/unsubscribe', auth, async (req, res) => {
    try {
        await User.findByIdAndUpdate(req.user.id, {
            $unset: { webPushSubscription: '' }
        });
        res.json({ success: true, msg: 'Push subscription removed' });
    } catch (err) {
        console.error('Web push unsubscribe error:', err.message);
        res.status(500).json({ msg: 'Server error removing subscription' });
    }
});

/**
 * GET /api/webpush/vapid-public-key
 * Returns the public VAPID key for the frontend to use when subscribing
 */
router.get('/vapid-public-key', (req, res) => {
    const key = process.env.VAPID_PUBLIC_KEY;
    if (!key) return res.status(500).json({ msg: 'VAPID not configured' });
    res.json({ publicKey: key });
});

module.exports = router;
