const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Attendance = require('../models/Attendance');
const Shop = require('../models/Shop');
const { getDistanceFromLatLonInKm } = require('../utils/geoUtils');
const mongoose = require('mongoose');
const { checkEffectiveSubscription } = require('../utils/subscriptionHelper');

// --- Helper: Get IST Date String (YYYY-MM-DD) ---
function getISTDateString() {
    const now = new Date();
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    const ist = new Date(utc + (3600000 * 5.5));
    return ist.toISOString().split('T')[0];
}

// --- Helper: Get IST Time String (HH:mm) ---
function getISTTimeString() {
    const now = new Date();
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    const ist = new Date(utc + (3600000 * 5.5));
    return ist.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
}

// @route   POST api/attendance/mark
// @desc    Mark attendance (in or out) with geofencing logic
// @access  Private (Staff only)
router.post('/mark', auth, async (req, res) => {
    try {
        const { shopId, latitude, longitude } = req.body;
        const workerId = req.user.id;

        // 0. Subscription Gating
        const sub = await checkEffectiveSubscription(workerId);
        if (!sub.isActive) {
            return res.status(403).json({
                success: false,
                msg: 'Attendance tracking requires an active Premium subscription. Please contact your shop owner.'
            });
        }

        if (!shopId || !latitude || !longitude) {
            return res.status(400).json({ msg: 'Missing parameters' });
        }

        const shop = await Shop.findById(shopId).select('location');
        if (!shop || !shop.location || !shop.location.coordinates) {
            return res.status(404).json({ msg: 'Shop location not found' });
        }

        // 1. Geofencing Check (40m)
        const [shopLon, shopLat] = shop.location.coordinates;
        const distanceKm = getDistanceFromLatLonInKm(latitude, longitude, shopLat, shopLon);
        const distanceMeters = distanceKm * 1000;
        const MAX_DISTANCE = 40;

        if (distanceMeters > MAX_DISTANCE) {
            return res.status(403).json({
                success: false,
                msg: `You are too far from the shop (${Math.round(distanceMeters)}m). Please move within 40m.`,
                distance: Math.round(distanceMeters)
            });
        }

        const date = getISTDateString();
        const time = getISTTimeString();

        // 2. Find or create record for today
        let record = await Attendance.findOne({ workerId, shopId, date });

        // 3. Determine type (in/out)
        // If no record or last log was 'out', mark as 'in'. Else 'out'.
        let type = 'in';
        if (record && record.logs.length > 0) {
            const lastLog = record.logs[record.logs.length - 1];
            type = lastLog.type === 'in' ? 'out' : 'in';
        }

        const newLog = {
            type,
            time,
            latitude,
            longitude,
            distance: Math.round(distanceMeters),
            timestamp: new Date()
        };

        if (record) {
            record.logs.push(newLog);
            await record.save();
        } else {
            record = new Attendance({
                workerId,
                shopId,
                date,
                logs: [newLog]
            });
            await record.save();
        }

        res.json({
            success: true,
            msg: `Successfully marked ${type.toUpperCase()} at ${time}`,
            type,
            distance: Math.round(distanceMeters)
        });

    } catch (err) {
        console.error('Error marking attendance:', err);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// @route   GET api/attendance/stats/:shopId
// @desc    Get attendance stats for a shop (Owner only)
// @access  Private
router.get('/stats/:shopId', auth, async (req, res) => {
    try {
        const { shopId } = req.params;
        const { date } = req.query; // Optional: YYYY-MM-DD

        // Verify ownership
        const shop = await Shop.findById(shopId);
        if (!shop) return res.status(404).json({ msg: 'Shop not found' });
        if (shop.owner.toString() !== req.user.id) {
            return res.status(403).json({ msg: 'Access denied' });
        }

        // Subscription Gating for stats
        const sub = await checkEffectiveSubscription(req.user.id);
        if (!sub.isActive) {
            return res.status(403).json({ msg: 'Attendance dashboard requires an active Premium subscription.' });
        }

        const targetDate = date || getISTDateString();

        const stats = await Attendance.find({ shopId, date: targetDate })
            .populate('workerId', 'name profilePicture')
            .sort({ 'logs.0.time': 1 }); // Sort by check-in time

        res.json(stats);

    } catch (err) {
        console.error('Error fetching attendance stats:', err);
        res.status(500).json({ msg: 'Server Error' });
    }
});

module.exports = router;
