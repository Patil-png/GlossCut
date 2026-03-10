const webpush = require('web-push');

// Set VAPID keys — must be set in .env
webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || 'mailto:support@glosscut.com',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
);

/**
 * Send a Web Push notification to a specific user via their saved subscription.
 * @param {Object} subscription - The PushSubscription object saved from the browser
 * @param {Object} payload - { title, body, icon, badge, tag, url, actions }
 */
const sendWebPush = async (subscription, payload) => {
    if (!subscription || !subscription.endpoint) return;
    if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
        console.warn('⚠️ VAPID keys not configured — skipping web push');
        return;
    }

    try {
        await webpush.sendNotification(
            subscription,
            JSON.stringify(payload),
            {
                TTL: 60 * 60 * 4, // Keep in push queue for 4 hours if device is offline
                urgency: 'high',
                topic: payload.tag || 'glosscut-booking', // Replaces prior notification of same tag
            }
        );
    } catch (err) {
        if (err.statusCode === 410 || err.statusCode === 404) {
            // Subscription expired — caller should clear it from DB
            console.log('📵 Web push subscription expired:', err.statusCode);
            throw { expired: true };
        }
        console.error('❌ Web push send error:', err.message);
    }
};

/**
 * Send push to a User document (looks up their webPushSubscription field)
 * @param {Object} user - Mongoose User document with .webPushSubscription
 * @param {Object} payload - Notification payload
 */
const sendPushToUser = async (user, payload) => {
    if (!user || !user.webPushSubscription) return;
    try {
        await sendWebPush(user.webPushSubscription, payload);
    } catch (err) {
        if (err.expired) {
            // Clear expired subscription to keep DB clean
            user.webPushSubscription = undefined;
            await user.save();
        }
    }
};

module.exports = { sendWebPush, sendPushToUser };
