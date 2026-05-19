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

    // --- CALCULATE ACCURATE ESTIMATED WAIT TIME FOR EVERYONE ---
    let runningWaitMinutes = 0;
    const now = new Date();

    activeBookings.forEach((app, index) => {
        // Arrival time is current time + running wait
        const arrivalDate = new Date(now.getTime() + runningWaitMinutes * 60000);
        app.estArrival = format(arrivalDate, 'hh:mm a');

        // Add this person's duration to the running total for the NEXT person
        let expectedDuration = 0;
        if (app.services && app.services.length > 0) {
            app.services.forEach(s => {
                expectedDuration += (parseInt(s.time) || parseInt(s.duration) || 15);
            });
        } else {
            expectedDuration = 30;
        }
        
        // If they have a duration offset (already started/delayed), apply it
        if (app.status === 'started' && app.startedAt) {
            const elapsed = Math.floor((now - new Date(app.startedAt)) / 60000);
            expectedDuration = Math.max(5, expectedDuration - elapsed);
        }

        runningWaitMinutes += expectedDuration;
    });

    // Find position of target booking
    const position = activeBookings.findIndex(
        (b) => b._id.toString() === targetBooking._id.toString()
    );

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
        estimatedWaitMinutes: activeBookings[position] ? 
            Math.max(0, Math.floor((new Date(`2000-01-01 ${activeBookings[position].estArrival}`).getTime() - new Date(`2000-01-01 ${format(now, 'hh:mm a')}`).getTime()) / 60000)) 
            : 0,
        estimatedWaitRange: {
            min: Math.max(0, runningWaitMinutes - 5),
            max: runningWaitMinutes + 10
        },
        targetBaseDuration,
        sortedQueue: activeBookings // Return the sorted array for the timeline
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
            .populate('barberId', 'name profilePicture phone')
            .populate('userId', 'name')
            .select('queueTrackingId _id customerName isOfflineBooking services status time date durationOffset startedAt barberId userId otp');

        if (!booking) {
            return res.status(404).json({ msg: 'Booking not found with this tracking ID' });
        }

        // 2. Get Shop details - Optimized: Select only name/location/address
        const shop = await Shop.findOne({
            $or: [
                { owner: booking.barberId._id },
                { staff: booking.barberId._id }
            ]
        }).select('name location address');

        // 3. Calculate Current Token using Database-Side Counting
        // 2. Get Shop details & Prepare Date Range
        const startOfDay = new Date(booking.date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(booking.date);
        endOfDay.setHours(23, 59, 59, 999);

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
        }).select('status appointmentType isPromoted tempDelayMinutes time services durationOffset startedAt createdAt customerName userId')
          .populate('userId', 'name');

        // Helper to mask names safely (e.g., "John Doe" -> "John D.")
        const maskName = (rawName) => {
            const name = String(rawName || "Guest");
            const parts = name.split(' ');
            if (parts.length <= 1) return name;
            return `${parts[0]} ${parts[parts.length - 1].charAt(0)}.`;
        };

        // Calculate queue position and dynamic wait time
        const queueInfo = calculateQueuePosition(allBookings, booking);
        queueInfo.currentToken = currentToken; 

        const queueList = (queueInfo.sortedQueue || []).map((app, idx) => {
            const rawName = app.isOfflineBooking ? app.customerName : app.userId?.name;
            return {
                id: app._id,
                name: maskName(rawName),
                time: app.time || '--:--',
                estArrival: app.estArrival || '--:--', // Add the live estimated arrival
                rank: idx + 1,
                status: String(app.status || 'confirmed'),
                isTarget: app._id.toString() === booking._id.toString()
            };
        });

        // Prepare response
        const response = {
            success: true,
            data: {
                trackingId: booking.queueTrackingId || booking._id,
                bookingId: booking._id,
                customerName: booking.isOfflineBooking ? String(booking.customerName || "VIP") : String(booking.userId?.name || "VIP"),
                shopName: String(shop?.name || 'Barbershop'),
                shopAddress: String(shop?.address || 'India'),
                barberName: booking.barberId?.name || 'Barber',
                barberImage: booking.barberId?.profilePicture || null,
                barberPhone: booking.barberId?.phone || '',
                services: booking.services.map((s) => s.name),
                status: booking.status,
                queuePosition: queueInfo.position,
                peopleAhead: queueInfo.peopleAhead,
                totalInQueue: queueInfo.totalActive,
                estimatedWaitMinutes: queueInfo.estimatedWaitMinutes,
                estimatedWaitRange: queueInfo.estimatedWaitRange, 
                bookingTime: booking.time,
                bookingDate: format(new Date(booking.date), 'MMM dd, yyyy'),
                currentToken: queueInfo.currentToken,
                barberId: booking.barberId._id,
                cancellationReason: booking.cancellationReason || '',
                durationOffset: booking.durationOffset || 0,
                startedAt: booking.startedAt || null,
                baseDuration: queueInfo.targetBaseDuration,
                otp: booking.otp || '----',
                queueList // NEW: List of everyone in queue
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
