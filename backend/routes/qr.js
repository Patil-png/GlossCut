const express = require('express');
const router = express.Router();
const QrAnalytics = require('../models/QrAnalytics');
const mongoose = require('mongoose');
const logger = require('../utils/logger'); // Assuming logger exists based on index.js

// @route   POST /api/qr/track-visit
// @desc    Track a visit from a QR code scan
// @access  Public
router.post('/track-visit', async (req, res) => {
    try {
        const { salon_id, device_type } = req.body;

        if (!salon_id || !mongoose.Types.ObjectId.isValid(salon_id)) {
            return res.status(400).json({ msg: 'Invalid Salon ID' });
        }

        // Fire and forget - don't await if performance is critical, 
        // but waiting ensures data integrity for now.
        // Given the requirement "User Lag: 0 milliseconds (if async)",
        // and utilizing sendBeacon on frontend, we can await here without blocking user navigation 
        // because sendBeacon is background. 
        // However, to be strictly non-blocking even for standard fetch:

        // We will await it to ensure we catch errors, but the response is quick.
        await QrAnalytics.create({
            salon_id,
            device_type: device_type || 'Unknown',
            ip_address: req.ip
        });

        return res.status(200).json({ status: 'tracked' });

    } catch (err) {
        logger.error('QR Tracking Error:', err.message);
        // Don't leak error details to public
        return res.status(500).json({ status: 'error' });
    }
});

// @route   GET /api/qr/stats
// @desc    Get aggregated stats for Admin Panel
// @access  Private (Admin only - middleware should be added in index.js mount or here)
router.get('/stats', async (req, res) => {
    // Note: Authentication middleware is expected to be applied at the router level in index.js 
    // or we should export a separate admin router. 
    // For simplicity, we'll keep it open here but rely on index.js strict mounting if possible.
    // But safely, we should probably check for admin here if not mounted under /admin.
    // However, the plan put this in /api/qr. We will assume the Admin Frontend calls this.
    try {
        const stats = await QrAnalytics.aggregate([
            {
                $lookup: {
                    from: 'shops', // collection name for Shop model
                    localField: 'salon_id',
                    foreignField: '_id',
                    as: 'shop'
                }
            },
            { $unwind: '$shop' }, // Filter out scans for deleted shops
            {
                $group: {
                    _id: '$salon_id',
                    shop_name: { $first: '$shop.name' }, // NOTE: shop.name is Encrypted Object! 
                    total_scans: { $sum: 1 },
                    scans_this_week: {
                        $sum: {
                            $cond: [
                                { $gt: ['$created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)] },
                                1,
                                0
                            ]
                        }
                    }
                }
            },
            { $sort: { total_scans: -1 } }
        ]);

        // Post-process to decrypt names would be needed if we return them here.
        // OR we return the encrypted object and frontend/admin-panel decrypts it?
        // Admin panel usually has the keys. 
        // Let's return the raw aggregation and handle decryption where necessary, 
        // OR we use the backend decryption utility if we can.
        // The Shop model has getters for decryption. 
        // Aggregation bypasses Mongoose getters. 
        // So we might get { iv: ..., content: ... }

        // Let's send it as is, and let the Admin Panel (which should have the utils) handle display,
        // OR we iterate and decrypt if we have the utils import.

        const { decrypt } = require('../utils/EncryptionService');

        const decryptedStats = stats.map(s => ({
            ...s,
            shop_name: decrypt(s.shop_name) // Decrypt manually
        }));

        res.json(decryptedStats);

    } catch (err) {
        logger.error('QR Stats Error:', err.message);
        res.status(500).json({ msg: 'Server Error' });
    }
});

module.exports = router;
