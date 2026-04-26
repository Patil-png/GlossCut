const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const Shop = require('../models/Shop');
const { format } = require('date-fns');

// Helper: Generate 6-digit alphanumeric tracking ID
function generateTrackingId() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude confusing characters (0, O, I, 1)
    let id = '';
    for (let i = 0; i < 6; i++) {
        id += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return id;
}

// Helper: Generate unique tracking ID with retry logic
async function generateUniqueTrackingId() {
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
        const trackingId = generateTrackingId();
        const existing = await Booking.findOne({ queueTrackingId: trackingId });

        if (!existing) {
            return trackingId;
        }

        attempts++;
    }

    throw new Error('Failed to generate unique tracking ID');
}

// Helper: Calculate queue position (uses same logic as QueueManagementScreen)
function calculateQueuePosition(allBookings, targetBooking) {
    // Helper for Express check
    const isExpress = (app) => {
        return (
            (app.appointmentType && app.appointmentType.toLowerCase().includes('express')) ||
            (app.isPromoted === true)
        );
    };

    // Filter active appointments (confirmed, started, pending)
    const activeBookings = allBookings.filter(
        (app) => ['confirmed', 'started', 'pending'].includes(app.status)
    );

    // Sort using same logic as QueueManagementScreen
    activeBookings.sort((a, b) => {
        // 1. Started Priority
        if (a.status === 'started' && b.status !== 'started') return -1;
        if (b.status === 'started' && a.status !== 'started') return 1;

        // 2. Tier Priority (With Demotion Check)
        const aIsExpress = isExpress(a) && (a.tempDelayMinutes || 0) < 500;
        const bIsExpress = isExpress(b) && (b.tempDelayMinutes || 0) < 500;

        if (aIsExpress && !bIsExpress) return -1;
        if (bIsExpress && !aIsExpress) return 1;

        // 3. FIFO (Time + Delay + Tier Weight)
        const getScore = (app) => {
            if (!app.time) return 9999;
            const [h, m] = app.time.split(':').map(Number);
            let val = (h * 60 + m) + (app.tempDelayMinutes || 0);

            if (!isExpress(app)) {
                val += 2000; // Basic user penalty
            }
            return val;
        };

        return getScore(a) - getScore(b);
    });

    // Find position of target booking
    const position = activeBookings.findIndex(
        (booking) => booking._id.toString() === targetBooking._id.toString()
    );

    // --- CALCULATE ACCURATE ESTIMATED WAIT TIME ---
    let totalWaitMinutes = 0;

    // Only calculate time for people STRICTLY AHEAD of the target
    for (let i = 0; i < position; i++) {
        const aheadBooking = activeBookings[i];

        // Sum expected duration of all services for this person
        let expectedDuration = 0;
        if (aheadBooking.services && aheadBooking.services.length > 0) {
            aheadBooking.services.forEach(s => {
                const duration = parseInt(s.time) || parseInt(s.duration) || 15; // default 15 if missing
                expectedDuration += duration;
            });
        } else {
            expectedDuration = 30; // Fallback if no services are defined
        }

        // Add any manual adjustments made by the barber
        expectedDuration += (aheadBooking.durationOffset || 0);

        if (aheadBooking.status === 'started' && aheadBooking.startedAt) {
            // Calculate how much time has already passed for the person in the chair
            const elapsedMs = Date.now() - new Date(aheadBooking.startedAt).getTime();
            const elapsedMinutes = Math.floor(elapsedMs / 60000);

            let remainingTime = expectedDuration - elapsedMinutes;

            // If they are taking longer than expected, default to a small 5 min buffer
            if (remainingTime < 0) remainingTime = 5;

            totalWaitMinutes += remainingTime;
        } else {
            // For pending people, add their full expected duration + 5 min transition buffer
            totalWaitMinutes += expectedDuration + 5;
        }
    }

    // Default to at least 0
    totalWaitMinutes = Math.max(0, totalWaitMinutes);

    // Calculate target booking's base duration
    let targetBaseDuration = 0;
    if (targetBooking.services && targetBooking.services.length > 0) {
        targetBooking.services.forEach(s => {
            const duration = parseInt(s.time) || parseInt(s.duration) || 15;
            targetBaseDuration += duration;
        });
    } else {
        targetBaseDuration = 30; // Fallback
    }

    return {
        position: position + 1, // 1-indexed
        totalActive: activeBookings.length,
        peopleAhead: position,
        currentToken: allBookings.filter((b) => b.status === 'completed').length + 1,
        estimatedWaitMinutes: totalWaitMinutes,
        estimatedWaitRange: {
            min: Math.max(0, totalWaitMinutes - 5),
            max: totalWaitMinutes + 10
        },
        targetBaseDuration
    };
}

// GET /api/booking/track/:trackingId - Track queue position
router.get('/track/:trackingId', async (req, res) => {
    try {
        const { trackingId } = req.params;

        // Validate tracking ID format:
        // 1. 6-digit alphanumeric (QueueTrackingId)
        // 2. 24-character hex (MongoDB ID)
        const isShortCode = /^[A-Z2-9]{6}$/.test(trackingId.toUpperCase());
        const isMongoId = /^[a-f\d]{24}$/i.test(trackingId);

        if (!isShortCode && !isMongoId) {
            return res.status(400).json({ msg: 'Invalid tracking ID format' });
        }

        // Find booking by tracking ID or MongoDB ID
        const query = isMongoId
            ? { _id: trackingId }
            : { queueTrackingId: trackingId.toUpperCase() };

        // 1. Initial Booking Fetch - Optimized: Select only what we show on screen
        const booking = await Booking.findOne(query)
            .populate('barberId', 'name')
            .populate('userId', 'name')
            .select('queueTrackingId _id customerName isOfflineBooking services status time date durationOffset startedAt barberId userId');

        if (!booking) {
            return res.status(404).json({ msg: 'Booking not found with this tracking ID' });
        }

        // 2. Get Shop details - Optimized: Select only name/location
        const shop = await Shop.findOne({
            $or: [
                { owner: booking.barberId._id },
                { staff: booking.barberId._id }
            ]
        }).select('name location');

        // 3. Calculate Current Token using Database-Side Counting
        const formattedDate = format(new Date(booking.date), 'yyyy-MM-dd');
        const startOfDay = new Date(formattedDate);
        const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

        const currentToken = await Booking.countDocuments({
            barberId: booking.barberId._id,
            date: { $gte: startOfDay, $lt: endOfDay },
            status: 'completed'
        }) + 1;

        // 3. Get Active Bookings ONLY - Optimized: Filter by active status at DB level
        const allBookings = await Booking.find({
            barberId: booking.barberId._id,
            date: { $gte: startOfDay, $lt: endOfDay },
            status: { $in: ['confirmed', 'started', 'pending'] },
            paymentStatus: { $ne: 'failed' },
        }).select('status appointmentType isPromoted tempDelayMinutes time services durationOffset startedAt createdAt');

        // Calculate queue position and dynamic wait time
        const queueInfo = calculateQueuePosition(allBookings, booking);
        queueInfo.currentToken = currentToken; // Use the optimized count

        // Prepare response
        const response = {
            success: true,
            data: {
                trackingId: booking.queueTrackingId || booking._id,
                bookingId: booking._id,
                customerName: booking.isOfflineBooking
                    ? booking.customerName?.split(' ')[0] + ' ' + booking.customerName?.split(' ').slice(-1)[0]?.charAt(0) + '.' // e.g., "John D."
                    : booking.userId?.name?.split(' ')[0] + ' ' + booking.userId?.name?.split(' ').slice(-1)[0]?.charAt(0) + '.',
                shopName: shop?.name || 'Barbershop',
                barberName: booking.barberId?.name || 'Barber',
                services: booking.services.map((s) => s.name),
                status: booking.status,
                queuePosition: queueInfo.position,
                peopleAhead: queueInfo.peopleAhead,
                totalInQueue: queueInfo.totalActive,
                estimatedWaitMinutes: queueInfo.estimatedWaitMinutes,
                estimatedWaitRange: queueInfo.estimatedWaitRange, // Returns {min, max}
                bookingTime: booking.time,
                bookingDate: format(new Date(booking.date), 'MMM dd, yyyy'),
                currentToken: queueInfo.currentToken,
                barberId: booking.barberId._id,
                cancellationReason: booking.cancellationReason || '',

                // Fields added for live started ticking:
                durationOffset: booking.durationOffset || 0,
                startedAt: booking.startedAt || null,
                baseDuration: queueInfo.targetBaseDuration
            },
        };

        res.json(response);
    } catch (err) {
        console.error('Error tracking queue:', err);
        res.status(500).json({ msg: 'Server error while tracking queue' });
    }
});

module.exports = router;
module.exports.generateUniqueTrackingId = generateUniqueTrackingId;
