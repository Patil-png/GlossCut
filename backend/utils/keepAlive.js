const https = require('https');
const logger = require('./logger');

/**
 * Pings the server's own health endpoint to keep it alive on Render.
 * Only pings during daytime hours (06:00 AM to 00:00 AM IST) 
 * to save Render free instance hours.
 */
const startKeepAlive = () => {
    const RENDER_URL = process.env.BASE_URL || process.env.RENDER_URL;

    if (!RENDER_URL) {
        console.log('⚠️ Keep-alive skipped: No BASE_URL or RENDER_URL found in .env');
        return;
    }

    const PING_INTERVAL = 14 * 60 * 1000; // 14 minutes

    console.log(`🚀 Keep-alive scheduler initialized for: ${RENDER_URL}`);

    setInterval(() => {
        // Calculate current IST time
        const now = new Date();
        const istOffset = 5.5 * 60 * 60 * 1000;
        const istTime = new Date(now.getTime() + istOffset);
        const currentHour = istTime.getUTCHours(); // This gets the IST hour since we added the offset

        // 24/7 Pinging: No longer suspended at night to ensure online visibility
        https.get(`${RENDER_URL}/api/health`, (res) => {
            if (res.statusCode === 200) {
                console.log(`✅ [IST ${currentHour}:00] Keep-alive ping successful`);
            } else {
                console.log(`⚠️ [IST ${currentHour}:00] Keep-alive ping failed: ${res.statusCode}`);
            }
        }).on('error', (err) => {
            console.error(`❌ Keep-alive error: ${err.message}`);
        });
    }, PING_INTERVAL);
};

module.exports = startKeepAlive;
