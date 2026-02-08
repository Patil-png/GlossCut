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

    return {
        position: position + 1, // 1-indexed
        totalActive: activeBookings.length,
        peopleAhead: position,
        currentToken: allBookings.filter((b) => b.status === 'completed').length + 1,
    };
}

// GET /api/booking/track/:trackingId - Track queue position
router.get('/track/:trackingId', async (req, res) => {
    try {
        const { trackingId } = req.params;

        // Validate tracking ID format (6 alphanumeric characters)
        if (!/^[A-Z2-9]{6}$/.test(trackingId.toUpperCase())) {
            return res.status(400).json({ msg: 'Invalid tracking ID format' });
        }

        // Find booking by tracking ID
        const booking = await Booking.findOne({
            queueTrackingId: trackingId.toUpperCase(),
        })
            .populate('barberId', 'name')
            .populate('userId', 'name');

        if (!booking) {
            return res.status(404).json({ msg: 'Booking not found with this tracking ID' });
        }

        // Check if booking is expired (more than 24 hours after completion/cancellation)
        if (['completed', 'cancelled'].includes(booking.status)) {
            const hoursSinceUpdate = (Date.now() - new Date(booking.updatedAt)) / (1000 * 60 * 60);
            if (hoursSinceUpdate > 24) {
                return res.status(410).json({ msg: 'This booking has expired and is no longer trackable' });
            }
        }

        // Get shop details
        const shop = await Shop.findOne({
            $or: [
                { owner: booking.barberId._id },
                { staff: booking.barberId._id }
            ]
        }).select('name location');

        // Get all bookings for same barber on same date
        const formattedDate = format(new Date(booking.date), 'yyyy-MM-dd');
        const allBookings = await Booking.find({
            barberId: booking.barberId._id,
            date: {
                $gte: new Date(formattedDate),
                $lt: new Date(new Date(formattedDate).getTime() + 24 * 60 * 60 * 1000),
            },
            paymentStatus: { $ne: 'failed' },
        });

        // Calculate queue position
        const queueInfo = calculateQueuePosition(allBookings, booking);

        // Calculate estimated wait time (assume 15 min per customer on average)
        const estimatedWaitMinutes = queueInfo.peopleAhead * 15;

        // Prepare response
        const response = {
            success: true,
            data: {
                trackingId: booking.queueTrackingId,
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
                estimatedWaitMinutes: estimatedWaitMinutes,
                bookingTime: booking.time,
                bookingDate: format(new Date(booking.date), 'MMM dd, yyyy'),
                currentToken: queueInfo.currentToken,
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
