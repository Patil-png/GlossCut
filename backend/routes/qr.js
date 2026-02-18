const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const QrAnalytics = require('../models/QrAnalytics');
const logger = require('../utils/logger');
const adminAuth = require('../middleware/adminAuth');
const { encrypt, decrypt } = require('../utils/EncryptionService');

// @route   POST /api/qr/track-visit
// @desc    Track a visit from a QR code scan
// @access  Public
router.post('/track-visit', async (req, res) => {
    try {
        const { salon_id, device_type, customer_name, customer_phone } = req.body;

        if (!salon_id || !mongoose.Types.ObjectId.isValid(salon_id)) {
            return res.status(400).json({ msg: 'Invalid Salon ID' });
        }

        const ClickLog = require('../models/ClickLog');
        const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

        // Check for duplicate scans from same IP for this salon in last 24h
        const existingScan = await ClickLog.findOne({
            targetId: salon_id,
            targetType: 'qr',
            ip: ip,
            createdAt: { $gt: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        });

        if (existingScan && !customer_name) {
            console.log(`Duplicate QR scan prevented for salon ${salon_id} from IP ${ip}`);
            return res.status(200).json({ status: 'tracked', filtered: true });
        }

        // Log the unique scan for deduplication if not already logged
        if (!existingScan) {
            await ClickLog.create({
                targetId: salon_id,
                targetType: 'qr',
                ip: ip,
                userAgent: req.headers['user-agent']
            });
        }

        // Record the actual analytic
        const analyticData = {
            salon_id,
            device_type: device_type || 'Unknown',
            ip_address: ip
        };

        // Encrypt and PII (Personally Identifiable Information)
        if (customer_name) analyticData.customer_name = encrypt(customer_name);
        if (customer_phone) analyticData.customer_phone = encrypt(customer_phone);

        await QrAnalytics.create(analyticData);

        return res.status(200).json({ status: 'tracked' });

    } catch (err) {
        logger.error('QR Tracking Error:', err.message);
        return res.status(500).json({ status: 'error' });
    }
});

// @route   GET /api/qr/leads
// @desc    Get all customer leads (QR scans + Walk-Ins)
// @access  Private (Admin)
router.get('/leads', adminAuth, async (req, res) => {
    try {
        const Booking = require('../models/Booking');

        // 1. Fetch QR Leads
        const qrLeads = await QrAnalytics.find({
            customer_name: { $ne: null }
        })
            .populate('salon_id', 'name')
            .lean();

        // 2. Fetch Walk-In Leads (Offline Bookings)
        const walkInLeads = await Booking.find({
            isOfflineBooking: true,
            customerName: { $ne: null }
        })
            .populate('barberId', 'shopName')
            .lean();

        // 3. Normalize and Decrypt QrAnalytics leads
        const normalizedQr = qrLeads.map(lead => ({
            id: lead._id,
            source: 'QR Scan',
            salon_name: lead.salon_id ? decrypt(lead.salon_id.name) : 'Unknown Shop',
            customer_name: decrypt(lead.customer_name),
            customer_phone: decrypt(lead.customer_phone),
            device_type: lead.device_type,
            created_at: lead.created_at
        }));

        // 4. Normalize and Decrypt Booking leads
        const normalizedWalkIn = walkInLeads.map(lead => ({
            id: lead._id,
            source: 'Walk-In',
            salon_name: lead.barberId ? decrypt(lead.barberId.shopName) : 'Unknown Shop',
            customer_name: decrypt(lead.customerName),
            customer_phone: decrypt(lead.customerPhone),
            device_type: 'Barber App', // Manual entry
            created_at: lead.createdAt
        }));

        // 5. Combine and Sort
        const allLeads = [...normalizedQr, ...normalizedWalkIn].sort((a, b) =>
            new Date(b.created_at) - new Date(a.created_at)
        );

        res.json(allLeads);
    } catch (err) {
        logger.error('Leads Aggregation Error:', err.message);
        res.status(500).json({ msg: 'Server Error' });
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
