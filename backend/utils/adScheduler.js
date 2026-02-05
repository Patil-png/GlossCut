const cron = require('node-cron');
const AdPlacement = require('../models/AdPlacement');
const { deleteFromR2, extractKeyFromUrl } = require('./r2Storage');
const { decrypt } = require('./EncryptionService');

const startAdScheduler = () => {
    // Run every hour to check for expired ads
    cron.schedule('0 * * * *', async () => {
        console.log('🕒 Running Ad Expiry & R2 Cleanup Scheduler...');
        const now = new Date();

        try {
            // Find ads that have ended but are not yet marked as expired
            // We only care about booked ads that have a mediaUrl (R2)
            const expiredAds = await AdPlacement.find({
                endDate: { $lt: now },
                status: { $ne: 'expired' },
                isBooked: true
            });

            if (expiredAds.length === 0) {
                console.log('✅ No new expired ads to clean up.');
                return;
            }

            console.log(`🔍 Found ${expiredAds.length} expired ads. Processing cleanup...`);

            for (const ad of expiredAds) {
                try {
                    // 1. Handle Media Cleanup (R2)
                    // Mongoose getters will handle decryption automatically if we don't use .lean()
                    const mediaUrl = ad.mediaUrl;

                    if (mediaUrl && typeof mediaUrl === 'string' && mediaUrl.includes('r2.cloudflarestorage.com')) {
                        const key = extractKeyFromUrl(mediaUrl);
                        if (key) {
                            console.log(`🗑️ Deleting R2 media for ad ${ad._id}: ${key}`);
                            await deleteFromR2(key);
                        }
                    }

                    // 2. Update Ad Status
                    ad.status = 'expired';
                    ad.mediaUrl = null; // Clear URL to avoid broken links
                    await ad.save();

                    console.log(`✅ Ad ${ad._id} marked as expired and media cleaned up.`);
                } catch (adError) {
                    console.error(`❌ Error processing cleanup for ad ${ad._id}:`, adError.message);
                }
            }
        } catch (error) {
            console.error('❌ Error in Ad Scheduler:', error.message);
        }
    });

    console.log('🚀 Ad Expiry Scheduler initialized (Hourly)');
};

module.exports = startAdScheduler;
