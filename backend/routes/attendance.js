const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Attendance = require('../models/Attendance');
const Shop = require('../models/Shop');
const { getDistanceFromLatLonInKm } = require('../utils/geoUtils');
const mongoose = require('mongoose');
const { checkEffectiveSubscription } = require('../utils/subscriptionHelper');

// --- Helper: Get IST Time String (HH:mm) ---
function getISTTimeString() {
    const now = new Date();
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    const ist = new Date(utc + (3600000 * 5.5));
    return ist.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
}

// --- Helper: Get Business Day Context ---
// Determines which business day a specific IST time belongs to based on shop hours.
// This handles shifts that cross midnight.
function getBusinessContext(operatingHours, istNow) {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

    const timeToMins = (t) => {
        if (!t) return null;
        const [h, m] = t.split(':').map(Number);
        return h * 60 + m;
    };

    const formatDate = (date) => date.toISOString().split('T')[0];

    const todayIdx = istNow.getDay();
    const nowMins = istNow.getHours() * 60 + istNow.getMinutes();

    // 1. Check Yesterday (for shifts that started yesterday and cross midnight)
    const yesterday = new Date(istNow);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayIdx = yesterday.getDay();
    const yesterdayHours = operatingHours?.[days[yesterdayIdx]];

    if (yesterdayHours?.open && yesterdayHours?.close) {
        const openMins = timeToMins(yesterdayHours.open);
        const closeMins = timeToMins(yesterdayHours.close);

        // If it crosses midnight (close < open) and we are currently before close time
        if (closeMins < openMins && nowMins < closeMins) {
            return { businessDate: formatDate(yesterday), dayHours: yesterdayHours };
        }
    }

    // 2. Check Tomorrow (special case for shifts starting before midnight but after 00:00 of the natural day?)
    // Actually, usually we check Today.
    const todayHours = operatingHours?.[days[todayIdx]];
    if (todayHours?.open && todayHours?.close) {
        const openMins = timeToMins(todayHours.open);
        const closeMins = timeToMins(todayHours.close);

        if (closeMins > openMins) {
            // Normal day shift
            if (nowMins >= openMins && nowMins < closeMins) {
                return { businessDate: formatDate(istNow), dayHours: todayHours };
            }
        } else {
            // Midnight-spanning shift starting today
            if (nowMins >= openMins || nowMins < closeMins) {
                return { businessDate: formatDate(istNow), dayHours: todayHours };
            }
        }
    }

    // Default fallback if no window matches
    return {
        businessDate: formatDate(istNow),
        dayHours: todayHours || { open: '09:00', close: '22:00' },
        outsideWindow: true
    };
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

        const shop = await Shop.findById(shopId).select('location operatingHours');
        if (!shop || !shop.location || !shop.location.coordinates) {
            return res.status(404).json({ msg: 'Shop location not found' });
        }

        // 1. Determine Business Day and Lockout Window
        const now = new Date();
        const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
        const istNow = new Date(utc + (3600000 * 5.5));

        const time = getISTTimeString();
        const { businessDate, dayHours, outsideWindow } = getBusinessContext(shop.operatingHours, istNow);
        const date = businessDate;

        // Find existing record to determine type (in/out)
        let record = await Attendance.findOne({ workerId, shopId, date });
        let type = 'in';
        if (record && record.logs.length > 0) {
            const lastLog = record.logs[record.logs.length - 1];
            type = lastLog.type === 'in' ? 'out' : 'in';
        }

        // Lockout Guard: Only block IN scans.
        if (type === 'in') {
            if (outsideWindow) {
                return res.status(403).json({
                    success: false,
                    msg: `Attendance is locked. Shop hours for today: ${dayHours.open || 'N/A'} to ${dayHours.close || 'N/A'}.`
                });
            }
        }
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

        // 3. Determine type (in/out)
        // If no record or last log was 'out', mark as 'in'. Else 'out'.
        // (type variable is already determined in the lockout check above)

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
            .populate('shopId', 'operatingHours')
            .sort({ 'logs.0.time': 1 });

        res.json(stats);
    } catch (err) {
        console.error('Error fetching attendance stats:', err);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// @route   GET api/attendance/monthly/:shopId
// @desc    Get monthly attendance report for a shop (Owner only)
// @access  Private
router.get('/monthly/:shopId', auth, async (req, res) => {
    try {
        const { shopId } = req.params;
        const { month, year } = req.query; // Expecting month (1-12) and year (YYYY)

        // Verify ownership
        const shop = await Shop.findById(shopId);
        if (!shop) return res.status(404).json({ msg: 'Shop not found' });
        if (shop.owner.toString() !== req.user.id) {
            return res.status(403).json({ msg: 'Access denied' });
        }

        // Subscription Gating
        const sub = await checkEffectiveSubscription(req.user.id);
        if (!sub.isActive) {
            return res.status(403).json({ msg: 'Monthly reports require an active Premium subscription.' });
        }

        const now = new Date();
        const targetYear = parseInt(year) || now.getFullYear();
        const targetMonth = parseInt(month) || (now.getMonth() + 1);

        // Calculate date range in IST strings (YYYY-MM-DD)
        const startDate = `${targetYear}-${targetMonth.toString().padStart(2, '0')}-01`;
        const lastDay = new Date(targetYear, targetMonth, 0).getDate();
        const endDate = `${targetYear}-${targetMonth.toString().padStart(2, '0')}-${lastDay.toString().padStart(2, '0')}`;

        const monthlyRecords = await Attendance.find({
            shopId,
            date: { $gte: startDate, $lte: endDate }
        }).populate('workerId', 'name profilePicture');

        // Group by worker
        const workerReport = {};

        monthlyRecords.forEach(record => {
            const workerId = record.workerId._id.toString();
            if (!workerReport[workerId]) {
                workerReport[workerId] = {
                    worker: record.workerId,
                    totalDays: 0,
                    days: []
                };
            }
            workerReport[workerId].totalDays += 1;
            workerReport[workerId].days.push({
                date: record.date,
                logs: record.logs.map(l => ({ type: l.type, time: l.time }))
            });
        });

        // Convert to array and sort days
        const report = Object.values(workerReport).map(item => {
            item.days.sort((a, b) => a.date.localeCompare(b.date));
            item.shopOperatingHours = shop.operatingHours;
            return item;
        });

        res.json(report);

    } catch (err) {
        console.error('Error fetching monthly stats:', err);
        res.status(500).json({ msg: 'Server Error' });
    }
});

module.exports = router;
