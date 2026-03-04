const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const Notification = require('../models/Notification');
const User = require('../models/User');
const SetkarCoinTransaction = require('../models/SetkarCoinTransaction');
const auth = require('../middleware/auth');
// IMPORT DECRYPTION HELPER (Crucial for Notifications & Logic)
const { decrypt } = require('../utils/EncryptionService');
const validate = require('../middleware/validate');
const schemas = require('../utils/validationSchemas');
const Joi = require('joi');
const { Expo } = require('expo-server-sdk');
const expo = new Expo();

// --- 1. HELPER: UNIFIED RANKING SYSTEM (Final Version) ---
const getBookingScore = (b) => {
  // A. Parse Time into Minutes (0 - 1440)
  const timeStr = b.time || "00:00";
  const cleanTime = timeStr.replace(/[^\d:]/g, '');
  const [h, m] = cleanTime.split(':').map(Number);
  const minutes = (h * 60) + (m || 0);

  // B. Priority "Weight" 
  let type = b.appointmentType || 'Basic';

  // *** FIX: REMOVED THE LINE THAT FORCED OFFLINE TO BASIC ***
  // Previously: if(b.isOfflineBooking) type = 'Basic'; 

  const typeLower = type.toLowerCase();

  let priorityWeight = 2000; // Default (Basic/Low)

  const isAppExpress = (typeLower.includes('express')) || (b.isPromoted === true);

  if (isAppExpress) priorityWeight = 0;
  else if (typeLower.includes('black')) priorityWeight = 1000;
  else if (typeLower.includes('premium')) priorityWeight = 1000;

  const delay = b.tempDelayMinutes || 0;

  // FINAL SCORE = PriorityBand + TimeOfDay + ManualDelay
  return priorityWeight + minutes + delay;
};

// --- CACHING LOGIC ---
const bookingCache = new Map();
const BOOKING_CACHE_DURATION = 2 * 60 * 1000;

const getBookingCached = (key) => {
  const cached = bookingCache.get(key);
  if (cached && Date.now() - cached.timestamp < BOOKING_CACHE_DURATION) {
    return cached.data;
  }
  bookingCache.delete(key);
  return null;
};

const setBookingCached = (key, data) => {
  bookingCache.set(key, { data, timestamp: Date.now() });
  if (bookingCache.size > 50) {
    const firstKey = bookingCache.keys().next().value;
    bookingCache.delete(firstKey);
  }
};

const PRIORITY_MAP = {
  'express': 1,
  'basic': 2,
  'premium': 3,
  'black premium': 4,
  'free': 5
};

const getPriorityValue = (appointment) => {
  const type = appointment.appointmentType;
  const isOffline = !!appointment.isOfflineBooking;
  let basePriority;

  if (!type) {
    basePriority = PRIORITY_MAP.basic;
  } else {
    const lowerCaseType = type.toLowerCase();
    basePriority = PRIORITY_MAP[lowerCaseType] || PRIORITY_MAP.basic;
  }
  // Offline keeps its priority but gets a tiny 0.5 nudge to sort below online OF SAME TIER
  return isOffline ? basePriority + 0.5 : basePriority;
};

const hasBlockingHigherPriorityBookings = (currentBooking, higherPriorityBookings) => {
  const currentPriority = getPriorityValue(currentBooking);

  return higherPriorityBookings.some(booking => {
    // RELAXATION: If a booking has been delayed/skipped, it loses its "Strict Blocking" power.
    // It effectively becomes "Basic" priority for blocking purposes, allowing the barber to
    // serve others if they choose to, without being hard-blocked by the system.
    if ((booking.tempDelayMinutes || 0) > 0 || (booking.skipCount || 0) > 0) {
      return false; // Delayed users don't block anyone
    }

    return getPriorityValue(booking) < currentPriority;
  });
};

// @route   GET api/booking/history
router.get('/history', auth, async (req, res) => {
  try {
    const bookings = await Booking.find({ userId: req.user.id })
      .populate('barberId', 'name email phone address rating reviews profilePicture shopName shopAddress shopPhone shopRating shopReviews')
      .select('+otp')
      .sort({ date: -1 });
    res.json(bookings);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: err.message });
  }
});

// @route   GET api/booking/barber
router.get('/barber', auth, async (req, res) => {
  try {
    const bookings = await Booking.find({ barberId: req.user.id, status: { $ne: 'cancelled' } })
      .populate('userId', 'name email profilePicture phone gender language')
      .sort({ date: -1, time: 1 });
    res.json(bookings);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: err.message });
  }
});

// @route   GET api/booking/my-daily-stats
// @desc    Get served (completed) and left (cancelled) stats for the authenticated barber for a specific date
router.get('/my-daily-stats', auth, async (req, res) => {
  try {
    const { date } = req.query;
    const queryDate = date ? new Date(date) : new Date();
    queryDate.setHours(0, 0, 0, 0); // Start of day

    const nextDay = new Date(queryDate);
    nextDay.setDate(nextDay.getDate() + 1); // End of day

    const stats = await Booking.aggregate([
      {
        $match: {
          barberId: new mongoose.Types.ObjectId(req.user.id),
          date: { $gte: queryDate, $lt: nextDay }
        }
      },
      {
        $group: {
          _id: null,
          served: {
            $sum: {
              $cond: [{ $eq: ["$status", "completed"] }, 1, 0]
            }
          },
          left: {
            $sum: {
              $cond: [{ $eq: ["$status", "cancelled"] }, 1, 0]
            }
          }
        }
      }
    ]);

    const result = stats.length > 0 ? stats[0] : { served: 0, left: 0 };
    res.json(result);

  } catch (err) {
    console.error('Error fetching daily stats:', err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
});

// @route   GET api/booking/barber/:barberId/all
router.get('/barber/:barberId/all', async (req, res) => {
  try {
    const bookings = await Booking.find({
      barberId: req.params.barberId,
      status: { $ne: 'cancelled' }
    }).sort({ date: -1, time: 1 });
    res.json(bookings);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: err.message });
  }
});

// @route   GET api/booking/todays-stats
// @desc    Get booking counts for ALL barbers for a specific date (Efficient)
router.get('/todays-stats', async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) return res.status(400).json({ msg: 'Date is required' });

    const queryDate = new Date(date);
    queryDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(queryDate);
    nextDay.setDate(nextDay.getDate() + 1);

    const stats = await Booking.aggregate([
      {
        $match: {
          date: { $gte: queryDate, $lt: nextDay },
          status: { $ne: 'cancelled' }
        }
      },
      {
        $group: {
          _id: '$barberId',
          count: { $sum: 1 }
        }
      }
    ]);

    // Convert array to map: { barberId: count }
    const result = {};
    stats.forEach(item => {
      if (item._id) {
        result[item._id.toString()] = item.count;
      }
    });

    res.json(result);
  } catch (err) {
    console.error('Stats aggregation error:', err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
});

// @route   GET api/booking/check-premium-availability-batch
router.get('/check-premium-availability-batch', auth, async (req, res) => {
  try {
    const { barberIds, date } = req.query;
    if (!barberIds || !date) return res.status(400).json({ msg: 'barberIds and date are required' });

    const ids = barberIds.split(',');
    const queryDate = new Date(date); queryDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(queryDate); nextDay.setDate(nextDay.getDate() + 1);

    const barbers = await User.find({ _id: { $in: ids } });
    const results = {};

    for (const barber of barbers) {
      const todaysBookings = await Booking.countDocuments({
        barberId: barber._id,
        date: { $gte: queryDate, $lt: nextDay },
        status: { $ne: 'cancelled' },
      });

      if (todaysBookings < barber.maxAppointmentsPerDay) {
        results[barber._id] = { type: 'free', count: barber.maxAppointmentsPerDay - todaysBookings };
      } else {
        const replaceableBookings = await Booking.countDocuments({
          barberId: barber._id,
          date: { $gte: queryDate, $lt: nextDay },
          status: { $nin: ['started', 'completed', 'cancelled'] },
          appointmentType: { $in: ['Basic'] },
        });
        results[barber._id] = { type: 'premium', count: replaceableBookings };
      }
    }
    res.json(results);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: err.message });
  }
});

// @route   GET api/booking/barber-appointments-batch
router.get('/barber-appointments-batch', auth, async (req, res) => {
  try {
    const { barberIds, date } = req.query;
    if (!barberIds || !date) return res.status(400).json({ msg: 'barberIds and date are required' });

    const ids = barberIds.split(',').filter(id => id && id.length > 0).map(id => {
      try { return new mongoose.Types.ObjectId(id); } catch (e) { return null; }
    }).filter(id => id !== null);

    const queryDate = new Date(date); queryDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(queryDate); nextDay.setDate(nextDay.getDate() + 1);

    const bookings = await Booking.find({
      barberId: { $in: ids },
      date: { $gte: queryDate, $lt: nextDay },
      status: { $ne: 'cancelled' },
    }).select('barberId status');

    const bookingCounts = {};
    ids.forEach(id => bookingCounts[id.toString()] = 0);
    bookings.forEach(booking => {
      const bId = booking.barberId.toString();
      bookingCounts[bId] = (bookingCounts[bId] || 0) + 1;
    });

    res.json(bookingCounts);
  } catch (err) {
    console.error('Barber appointments batch error:', err.message);
    res.json({});
  }
});

// @route   GET api/booking/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('barberId', 'name email phone address rating reviews profilePicture shopName shopAddress shopPhone')
      .populate('userId', 'name email profilePicture phone gender language');
    if (!booking) return res.status(404).json({ msg: 'Booking not found' });

    const bookingResponse = await Booking.findById(booking._id).select('+otp').populate('barberId', 'name email phone address rating reviews profilePicture shopName shopAddress shopPhone').populate('userId', 'name email profilePicture phone gender language');
    res.json(bookingResponse);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: err.message });
  }
});

// @route   PUT api/booking/accept/:id
router.put('/accept/:id', auth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ msg: 'Booking not found' });
    if (booking.barberId.toString() !== req.user.id) return res.status(401).json({ msg: 'User not authorized' });

    booking.status = 'confirmed';
    await booking.save();

    const updatedBooking = await Booking.findById(req.params.id).populate('userId', 'name email profilePicture phone gender language');
    const user = await User.findById(booking.userId);
    if (user) {
      // req.user.name is from auth middleware (User model), so it is decrypted automatically by the getter
      const notification = new Notification({ userId: user._id, title: 'Booking Confirmed', message: `Your booking with ${req.user.name} has been confirmed.` });
      await notification.save();
      const io = req.app.get('io');
      if (io) {
        io.to(`user_${booking.userId}`).emit('notification', notification.toObject());
        // Optimize: Send direct status update to avoid polling on client
        io.to(`user_${booking.userId}`).emit('booking_update', {
          bookingId: booking._id.toString(),
          status: 'confirmed'
        });
        // NEW: Notify barber room to refresh UI across all instances (tabs/apps)
        io.to(`barber_${booking.barberId.toString()}`).emit('booking_update', {
          bookingId: booking._id.toString(),
          status: 'confirmed'
        });
      }
    }

    // For offline bookings (walk-ins), emit to booking-specific room
    const io = req.app.get('io');
    if (io && booking.isOfflineBooking) {
      io.to(`booking_${booking._id.toString()}`).emit('booking_status_update', {
        bookingId: booking._id.toString(),
        status: 'confirmed'
      });
      console.log(`✅ Emitted confirmation to booking_${booking._id.toString()}`);
    }

    res.json(updatedBooking);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: err.message });
  }
});

// @route   POST api/booking/verify-otp-and-start/:id
router.post('/verify-otp-and-start/:id', auth, validate(schemas.verifyBookingOtp.keys({ bookingId: Joi.forbidden() })), async (req, res) => {
  try {
    const { otp } = req.body;
    const booking = await Booking.findById(req.params.id).select('+otp');

    if (!booking) return res.status(404).json({ msg: 'Booking not found' });
    if (booking.barberId.toString() !== req.user.id) return res.status(401).json({ msg: 'User not authorized' });

    if (!booking.isOfflineBooking) {
      // OTP is encrypted in DB, but Mongoose getter decrypts it on access
      if (booking.otp !== otp) return res.status(400).json({ msg: 'Invalid OTP' });
    }

    booking.status = 'started';
    booking.startedAt = new Date();
    booking.tempDelayMinutes = 0; // Reset delay on start

    await booking.save();

    const updatedBooking = await Booking.findById(req.params.id).populate('userId', 'name email profilePicture phone gender language');
    const user = await User.findById(booking.userId);
    if (user) {
      const notification = new Notification({ userId: user._id, title: 'Booking Started', message: `Your booking with ${req.user.name} has started.` });
      await notification.save();
    }
    res.json(updatedBooking);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: err.message });
  }
});

// @route   PUT api/booking/decline/:id
router.put('/decline/:id', auth, validate(schemas.declineBooking), async (req, res) => {
  try {
    const { cancellationReason } = req.body;
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ msg: 'Booking not found' });
    if (booking.barberId.toString() !== req.user.id) return res.status(401).json({ msg: 'User not authorized' });

    const higherPriority = await Booking.find({
      barberId: booking.barberId, date: booking.date, paymentStatus: 'pending', status: { $in: ['confirmed', 'pending'] },
    });
    if (hasBlockingHigherPriorityBookings(booking, higherPriority)) {
      return res.status(400).json({ msg: 'Cannot decline. Higher priority booking pending payment.' });
    }

    booking.status = 'cancelled';
    booking.cancellationReason = cancellationReason || 'Booking declined by barber';
    await booking.save();

    if (cancellationReason && (cancellationReason.toLowerCase().includes('skipping') || cancellationReason.toLowerCase().includes('late'))) {
      const user = await User.findById(booking.userId);
      if (user) {
        let refundAmount = booking.appointmentType === 'Express' ? 19 : 7;
        user.setkarCoins = (user.setkarCoins || 0) + refundAmount;
        const txn = new SetkarCoinTransaction({ userId: user._id, type: 'recharge', amount: refundAmount, description: `Refund for cancellation: ${cancellationReason}` });
        await txn.save();
        await user.save();
      }
    }

    const displaced = await Booking.findOne({ barberId: booking.barberId, status: 'cancelled', cancellationReason: 'Cancelled due to a higher priority booking.' }).sort({ createdAt: -1 });
    if (displaced) {
      const displacedUser = await User.findById(displaced.userId);
      if (displacedUser) {
        displacedUser.setkarCoins = Math.max(0, (displacedUser.setkarCoins || 0) - displaced.totalPrice);
        await displacedUser.save();
      }
      displaced.status = 'confirmed';
      displaced.cancellationReason = '';
      await displaced.save();
    }

    const updatedBooking = await Booking.findById(req.params.id).populate('userId', 'name email profilePicture phone gender language');
    const user = await User.findById(booking.userId);
    if (user) {
      // cancellationReason is also encrypted in model, but accessed here via Mongoose getter, so it is a string
      const n = new Notification({ userId: user._id, title: 'Booking Cancelled', message: `Your booking was cancelled: ${booking.cancellationReason}` });
      if (io) {
        io.to(`user_${booking.userId}`).emit('notification', n.toObject());
        // NEW: Notify barber room to refresh UI
        io.to(`barber_${booking.barberId.toString()}`).emit('booking_update', {
          bookingId: booking._id.toString(),
          status: 'cancelled'
        });
        // NEW: Notify booking room for instant offline customer update
        io.to(`booking_${booking._id.toString()}`).emit('booking_status_update', {
          bookingId: booking._id.toString(),
          status: 'cancelled'
        });
      }
    }
    res.json(updatedBooking);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: err.message });
  }
});

// Shared logic for cancelling a booking
async function handleCancellation(req, res, booking) {
  try {
    const displaced = await Booking.findOne({
      barberId: booking.barberId,
      status: 'cancelled',
      cancellationReason: 'Cancelled due to a higher priority booking.'
    }).sort({ createdAt: -1 });

    if (displaced) {
      displaced.status = 'confirmed';
      displaced.cancellationReason = '';
      await displaced.save();
    }

    booking.status = 'cancelled';
    await booking.save();

    // Notify sockets if possible
    const io = req.app.get('io');
    if (io) {
      io.to(`user_${booking.userId}`).emit('bookingDisconnected', { bookingId: booking._id });
      // Also notify barber if they are viewing the queue
      io.to(`barber_${booking.barberId}`).emit('queue_update');
    }

    return res.json({ msg: 'Booking cancelled' });
  } catch (err) {
    console.error(err.message);
    return res.status(500).json({ msg: err.message });
  }
}

// @route   PUT/POST api/booking/cancel/:id
// @desc    Cancel booking (supports PUT with auth or POST without auth for browser sendBeacon)
router.route('/cancel/:id').all(async (req, res, next) => {
  // auth is required for PUT (manual cancel), but optional for POST (tab closure via sendBeacon)
  if (req.method === 'PUT') {
    return auth(req, res, next);
  }
  next();
}).put(async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ msg: 'Booking not found' });

    // Security: Only the user who made the booking (identified by auth token) can cancel via PUT
    if (booking.userId.toString() !== req.user.id) return res.status(401).json({ msg: 'User not authorized' });
    if (booking.paymentStatus !== 'pending') return res.status(400).json({ msg: 'Cannot cancel a paid booking' });

    return handleCancellation(req, res, booking);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: err.message });
  }
}).post(async (req, res) => {
  // This matches navigator.sendBeacon (used when tab is closed)
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ msg: 'Booking not found' });

    // No auth needed here because sendBeacon can't send headers easily during closure,
    // but we ONLY allow it if the booking is still pending payment.
    if (booking.paymentStatus !== 'pending') return res.status(400).json({ msg: 'Cannot auto-cancel a paid booking' });

    return handleCancellation(req, res, booking);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: err.message });
  }
});

// @route   POST api/booking/verify-otp
router.post('/verify-otp', auth, validate(schemas.verifyBookingOtp), async (req, res) => {
  try {
    const { bookingId, otp } = req.body;
    const booking = await Booking.findById(bookingId).select('+otp');
    if (!booking) return res.status(404).json({ msg: 'Booking not found' });
    if (booking.otp !== otp) return res.status(400).json({ msg: 'Invalid OTP' });
    res.json({ status: 'success', message: 'OTP verified' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: err.message });
  }
});

// @route   PUT api/booking/complete/:id
router.put('/complete/:id', auth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ msg: 'Booking not found' });
    if (booking.barberId.toString() !== req.user.id) return res.status(401).json({ msg: 'User not authorized' });

    booking.status = 'completed';
    if (booking.isOfflineBooking) booking.paymentStatus = 'completed';
    await booking.save();

    // Reset delays so skipped users float back up
    await Booking.updateMany({
      barberId: booking.barberId,
      date: booking.date,
      status: 'confirmed'
    }, { tempDelayMinutes: 0 });

    const barberUser = await User.findById(booking.barberId);
    if (barberUser) { barberUser.todaysBookings = (barberUser.todaysBookings || 0) + 1; await barberUser.save(); }

    const updatedBooking = await Booking.findById(req.params.id).populate('userId', 'name email profilePicture phone gender language');

    const user = await User.findById(booking.userId);
    if (user) {
      user.completedBookings = (user.completedBookings || 0) + 1;
      user.setkarCoins = (user.setkarCoins || 0) + 1;

      const milestone = Math.floor(user.completedBookings / 10);
      const oldMilestone = Math.floor((user.completedBookings - 1) / 10);
      if (milestone > oldMilestone) {
        user.setkarCoins += 10;
        user.loyaltyRewardsEarned = (user.loyaltyRewardsEarned || 0) + 1;
        user.lastLoyaltyRewardDate = new Date();
        const ltx = new SetkarCoinTransaction({ userId: user._id, type: 'recharge', amount: 10, description: `Loyalty reward for ${user.completedBookings} bookings` });
        await ltx.save();
      }
      await user.save();

      const tx = new SetkarCoinTransaction({ userId: user._id, type: 'recharge', amount: 1, description: 'Completion Reward' });
      await tx.save();

      const n = new Notification({ userId: user._id, title: 'Booking Completed', message: 'Booking completed. 1 Coin earned.' });
      await n.save();
      const io = req.app.get('io');
      if (io) {
        io.to(`barber_${booking.barberId.toString()}`).emit('booking_update', {
          bookingId: booking._id.toString(),
          status: 'completed'
        });
      }
    }

    const barber = await User.findById(booking.barberId);
    if (barber) {
      // UPDATED: Manually decrypt here just to be 100% safe against "Invisible Text" in notifications
      const rawIdentifier = updatedBooking.isOfflineBooking ? updatedBooking.customerName : updatedBooking.userId.name;
      // Use decrypt() to ensure we get the string, even if the model getter missed it somehow (which it shouldn't, but this is safer)
      const identifier = decrypt(rawIdentifier);
      const bn = new Notification({ userId: barber._id, title: 'Booking Completed', message: `Booking for ${identifier} completed.` });
      await bn.save();
    }

    res.json(updatedBooking);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: err.message });
  }
});

// @route   PUT api/booking/:id/adjust-time
// @desc    Adjust the duration offset of an active appointment
// @access  Private (Barber only)
router.put('/:id/adjust-time', auth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ msg: 'Booking not found' });
    if (booking.barberId.toString() !== req.user.id) return res.status(401).json({ msg: 'User not authorized' });
    if (booking.status !== 'started') return res.status(400).json({ msg: 'Only started bookings can have their time adjusted' });

    const { minutes } = req.body;
    if (typeof minutes !== 'number') return res.status(400).json({ msg: 'Minutes must be a number' });

    booking.durationOffset = (booking.durationOffset || 0) + minutes;
    await booking.save();

    res.json(booking);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: err.message });
  }
});

// @route   PUT api/booking/:id/almost-done
// @desc    Trigger a 10-minute warning for the next customer in queue
// @access  Private (Barber only)
router.put('/:id/almost-done', auth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ msg: 'Booking not found' });
    if (booking.barberId.toString() !== req.user.id) return res.status(401).json({ msg: 'User not authorized' });
    if (booking.status !== 'started') return res.status(400).json({ msg: 'Only started bookings can trigger the next customer' });

    // Find the next booking in the queue
    const today = new Date(booking.date); today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);

    const queue = await Booking.find({
      barberId: booking.barberId,
      date: { $gte: today, $lt: tomorrow },
      status: { $in: ['confirmed', 'pending'] }
    });

    if (queue.length === 0) {
      return res.json({ msg: 'No one waiting in the queue to notify' });
    }

    const sortedQueue = queue.sort((a, b) => {
      const sA = getBookingScore(a);
      const sB = getBookingScore(b);
      if (sA !== sB) return sA - sB;
      return new Date(a.createdAt) - new Date(b.createdAt);
    });

    const nextBooking = sortedQueue[0];

    // Notification Logic for the next user
    if (!nextBooking.isOfflineBooking && nextBooking.userId) {
      const user = await User.findById(nextBooking.userId);
      if (user) {
        const n = new Notification({
          userId: user._id,
          title: "You're Up Next!",
          message: "Your barber is almost ready. Please head to the shop immediately to keep your spot!"
        });
        await n.save();

        const io = req.app.get('io');
        if (io) {
          io.to(`user_${nextBooking.userId}`).emit('notification', n.toObject());
          // Also trigger a specific alert event that the frontend app can listen to
          io.to(`user_${nextBooking.userId}`).emit('almost_ready_call', { bookingId: nextBooking._id });
        }
      }
    } else if (nextBooking.isOfflineBooking) {
      // For offline bookings, emit to the tracking room
      const io = req.app.get('io');
      if (io) {
        io.to(`booking_${nextBooking._id.toString()}`).emit('almost_ready_call', { bookingId: nextBooking._id });
      }
    }

    res.json({ msg: 'Triggered 10-minute warning for the next customer', nextBookingId: nextBooking._id });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: err.message });
  }
});

// @route   PUT api/booking/:id/add-services
// @desc    Add extra services to an ongoing appointment
// @access  Private (Barber only)
router.put('/:id/add-services', auth, async (req, res) => {
  try {
    const { services: newServices } = req.body;

    // Validate input
    if (!newServices || !Array.isArray(newServices) || newServices.length === 0) {
      return res.status(400).json({ msg: 'Services array is required and must not be empty' });
    }

    // Find appointment
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ msg: 'Appointment not found' });
    }

    // Verify ownership
    if (booking.barberId.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'User not authorized' });
    }

    // Verify appointment is in progress
    if (booking.status !== 'started') {
      return res.status(400).json({ msg: 'Can only add services to appointments that are in progress (started)' });
    }

    // Add new services to existing services array
    booking.services = [...booking.services, ...newServices];

    // Recalculate total price
    const newTotal = booking.services.reduce((sum, service) => {
      const price = parseFloat(service.price) || 0;
      return sum + price;
    }, 0);

    booking.totalPrice = newTotal;

    // Save updated booking
    await booking.save();

    // Fetch updated booking with populated user data
    const updatedBooking = await Booking.findById(req.params.id)
      .populate('userId', 'name email profilePicture phone gender language');

    console.log(`✅ Added ${newServices.length} service(s) to appointment ${booking._id}. New total: ₹${newTotal}`);

    res.json({
      msg: 'Services added successfully',
      booking: updatedBooking,
      addedServices: newServices,
      newTotal: newTotal
    });

  } catch (err) {
    console.error('Error adding services:', err.message);
    res.status(500).json({ msg: err.message });
  }
});

// @route   PUT api/booking/swap-down/:id
router.put('/swap-down/:id', auth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ msg: 'Booking not found' });
    if (booking.barberId.toString() !== req.user.id) return res.status(401).json({ msg: 'User not authorized' });
    if (booking.status !== 'confirmed') return res.status(400).json({ msg: 'Only confirmed bookings can swap' });

    // --- 1. THE "3-STRIKE" CANCELLATION LOGIC ---
    booking.skipCount = (booking.skipCount || 0) + 1;

    if (booking.skipCount > 2) {
      booking.status = 'cancelled';
      booking.cancellationReason = 'Cancelled automatically due to excessive delays (3 swaps).';
      await booking.save();

      const user = await User.findById(booking.userId);
      if (user) {
        let refundAmount = booking.appointmentType === 'Express' ? 19 : 7;
        user.setkarCoins = (user.setkarCoins || 0) + refundAmount;
        const txn = new SetkarCoinTransaction({
          userId: user._id,
          type: 'recharge',
          amount: refundAmount,
          description: 'Refund: Auto-cancelled due to excessive skips'
        });
        await txn.save();
        await user.save();

        const n = new Notification({ userId: user._id, title: 'Booking Cancelled', message: 'Booking cancelled due to too many delays.' });
        await n.save();
      }
      return res.json({ msg: 'Booking cancelled due to maximum skips', booking, status: 'cancelled' });
    }

    // --- 2. FETCH QUEUE ---
    const dayStart = new Date(booking.date); dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart); dayEnd.setDate(dayEnd.getDate() + 1);

    const queue = await Booking.find({
      barberId: booking.barberId,
      date: { $gte: dayStart, $lt: dayEnd },
      status: 'confirmed',
      _id: { $ne: booking._id }
    });

    const sortedQueue = queue.sort((a, b) => {
      const sA = getBookingScore(a);
      const sB = getBookingScore(b);
      if (sA !== sB) return sA - sB;
      return new Date(a.createdAt) - new Date(b.createdAt);
    });

    // --- 3. CALCULATE DELAY ---
    let newDelay = 0;
    const myBaseInfo = booking.toObject();
    myBaseInfo.tempDelayMinutes = 0;
    const myBaseScore = getBookingScore(myBaseInfo);

    const nextBooking = sortedQueue.find(b => getBookingScore(b) > getBookingScore(booking));

    if (booking.appointmentType === 'Express') {
      // STRATEGY: "Hard Demotion" (Explicit Target)
      // Find the first Non-Express user (Basic/Premium) to ensure we fall behind them.
      const firstBasic = sortedQueue.find(b => {
        const type = (b.appointmentType || 'Basic').toLowerCase();
        return !type.includes('express');
      });

      if (firstBasic) {
        // Fall behind the first Basic user
        const targetScore = getBookingScore(firstBasic);
        newDelay = (targetScore - myBaseScore) + 5;
      } else {
        // If NO Basic users exist (Queue is all Express), fall behind the next Express user
        if (nextBooking) {
          const targetScore = getBookingScore(nextBooking);
          newDelay = (targetScore - myBaseScore) + 5;
        } else {
          // Nobody ahead, just bump
          const currentDelay = booking.tempDelayMinutes || 0;
          newDelay = currentDelay + 20;
        }
      }
    } else {
      // Basic/Regular logic
      if (!nextBooking) return res.status(400).json({ msg: 'Already last' });
      const targetScore = getBookingScore(nextBooking);
      newDelay = (targetScore - myBaseScore) + 1;
    }

    if (newDelay < 0) newDelay = 1;
    if (newDelay > 3500) newDelay = 3500; // Cap at ~2.5 days equivalent, enough to be last

    booking.tempDelayMinutes = newDelay;
    await booking.save();

    res.json({ msg: 'Swapped successfully', booking });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: err.message });
  }
});

// @route   POST api/booking (Create Booking)
router.post('/', auth, validate(schemas.createBooking), async (req, res) => {
  const { barberId, date, time, services, totalPrice, appointmentType, isOfflineBooking, customerName, customerPhone } = req.body;
  try {
    const barber = await User.findById(barberId);
    if (!barber) return res.status(404).json({ msg: 'Barber not found' });

    // Check availability
    if (barber.isAvailable === false) {
      return res.status(400).json({ msg: 'Barber is currently offline and not accepting new bookings.' });
    }

    const today = new Date(date); today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    const count = await Booking.countDocuments({
      barberId,
      date: { $gte: today, $lt: tomorrow },
      $or: [
        { status: { $in: ['completed', 'started'] } },
        { paymentStatus: 'completed', status: { $ne: 'cancelled' } },
        { paymentStatus: 'pending', status: { $in: ['confirmed', 'pending'] }, createdAt: { $gte: tenMinutesAgo } }
      ]
    });

    if (count >= barber.maxAppointmentsPerDay) {
      if (appointmentType !== 'Express') return res.status(400).json({ msg: 'Fully booked' });

      const toCancel = await Booking.findOne({ barberId, date: { $gte: today, $lt: tomorrow }, status: { $nin: ['started', 'completed', 'cancelled'] }, appointmentType: { $in: ['Basic', 'Walk-in'] } }).sort({ createdAt: -1 });
      if (toCancel) {
        toCancel.status = 'cancelled';
        toCancel.cancellationReason = 'Cancelled due to a higher priority booking.';
        await toCancel.save();
        const cUser = await User.findById(toCancel.userId);
        if (cUser) {
          const add = toCancel.appointmentType === 'Express' ? 20 : 7;
          cUser.setkarCoins = (cUser.setkarCoins || 0) + add;
          await cUser.save();
          const notif = new Notification({ userId: cUser._id, title: 'Booking Cancelled', message: 'Higher priority booking displaced you.' });
          await notif.save();
        }
      } else {
        return res.status(400).json({ msg: 'Fully booked with high priority' });
      }
    }

    const otp = isOfflineBooking ? undefined : Math.floor(100000 + Math.random() * 900000).toString();

    // 1. Create Object (Do not save yet)
    // customerName and customerPhone are strings here. Model's 'set: encrypt' will handle encryption upon save.
    const newBooking = new Booking({
      userId: isOfflineBooking ? undefined : req.user.id,
      barberId, date, time, services, totalPrice, appointmentType,
      isOfflineBooking: isOfflineBooking || false,
      customerName, customerPhone,
      paymentStatus: isOfflineBooking ? 'completed' : 'pending',
      status: isOfflineBooking ? 'confirmed' : 'pending',
      otp,
      tempDelayMinutes: 0
    });

    // 2. CHECK FOR EXISTING SKIPPED BOOKINGS OF SAME TYPE
    // FIX: Filter out "Demoted" users (large delay) so they don't drag down new users.
    const activeSameTypeBookings = await Booking.find({
      barberId,
      date: { $gte: today, $lt: tomorrow },
      status: { $in: ['confirmed', 'started'] },
      appointmentType: appointmentType,
      tempDelayMinutes: { $lt: 500 } // Ignore demoted users
    });

    if (activeSameTypeBookings.length > 0) {
      let maxEffectiveScore = 0;

      activeSameTypeBookings.forEach(b => {
        const score = getBookingScore(b);
        if (score > maxEffectiveScore) maxEffectiveScore = score;
      });

      const myNaturalScore = getBookingScore(newBooking);

      if (myNaturalScore <= maxEffectiveScore) {
        newBooking.tempDelayMinutes = (maxEffectiveScore - myNaturalScore) + 1;
      }
    }

    // 3. Save
    const saved = await newBooking.save();

    // === DEBUG LOGGING START ===
    console.log('═══════════════════════════════════════');
    console.log('📋 NEW BOOKING CREATED');
    console.log('═══════════════════════════════════════');
    console.log('🆔 Booking ID:', saved._id);
    console.log('💈 Target Barber ID from request:', barberId);
    console.log('👤 Customer:', isOfflineBooking ? customerName : req.user.name);
    console.log('⏰ Time:', time);
    console.log('💰 Price:', totalPrice);
    console.log('═══════════════════════════════════════');
    // === DEBUG LOGGING END ===

    // 2. Notification for barber (ONLY for Walk-ins/Offline)
    // Online bookings are notified via payment.js AFTER payment is verified
    if (isOfflineBooking && barber) {
      // 1. In-App Notification (Existing)
      const message = `New walk-in booking from ${customerName}`;
      const n = new Notification({ userId: barber._id, title: 'New Walk-in', message: message });
      await n.save();

      // 2. Push Notification (Enhanced)
      if (barber.expoPushToken && Expo.isExpoPushToken(barber.expoPushToken) && barber.notificationsEnabled !== false) {
        try {
          const formattedTime = time || 'Not specified';
          const notificationTitle = `New Walk-in Booking`;
          const notificationBody = `${customerName} • ${formattedTime}\nConfirmed & Ready to start`;

          await expo.sendPushNotificationsAsync([{
            to: barber.expoPushToken,
            sound: 'default',
            title: notificationTitle,
            body: notificationBody,
            data: {
              type: 'booking_new',
              bookingId: saved._id.toString(),
              customerName: customerName,
              appointmentType: appointmentType,
              time: formattedTime,
              price: totalPrice,
              isOffline: true
            },
            channelId: 'high_priority',
            priority: 'high',
          }]);
        } catch (error) {
          console.error('Push notification error (offline):', error.message);
        }
      }
    }

    // 3. Real-time Socket Notification
    const io = req.app.get('io');
    if (io && isOfflineBooking) {
      io.to(`barber_${barberId}`).emit('new_booking', {
        bookingId: saved._id,
        customerName: customerName, // isOfflineBooking handles encryption in model
        appointmentType: saved.appointmentType,
        time: saved.time,
        services: saved.services,
        status: 'confirmed' // Walk-ins now auto-confirmed
      });
      // Also notify the booking-specific room for the customer-side UI
      io.to(`booking_${saved._id.toString()}`).emit('booking_status_update', {
        bookingId: saved._id.toString(),
        status: 'confirmed'
      });
    }

    res.json(saved);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: err.message });
  }
});

// @route   GET api/booking/daily-counts/:barberId
router.get('/daily-counts/:barberId', auth, async (req, res) => {
  try {
    const queryDate = new Date(req.query.date); queryDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(queryDate); nextDay.setDate(nextDay.getDate() + 1);
    const apps = await Booking.find({ barberId: req.params.barberId, date: { $gte: queryDate, $lt: nextDay }, status: { $ne: 'cancelled' } });
    const counts = apps.reduce((acc, curr) => { acc[curr.appointmentType] = (acc[curr.appointmentType] || 0) + 1; return acc; }, {});
    res.json(counts);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: err.message });
  }
});

// @route   GET api/booking/barber-appointments/:barberId
// @desc    Get appointments with UNIFIED SCORE Sorting
router.get('/barber-appointments/:barberId', auth, async (req, res) => {
  try {
    const { barberId } = req.params;
    const { date } = req.query;
    if (!date) return res.status(400).json({ msg: 'Date required' });

    const queryDate = new Date(date); queryDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(queryDate); nextDay.setDate(nextDay.getDate() + 1);

    const bookings = await Booking.find({
      barberId,
      date: { $gte: queryDate, $lt: nextDay },
      status: { $ne: 'cancelled' },
    })
      .populate('userId', 'name _id phone')
      .populate('userId', 'name _id phone')
      .select('customerName isOfflineBooking date time appointmentType totalPrice status services paymentStatus tempDelayMinutes skipCount createdAt isPromoted durationOffset startedAt');

    bookings.sort((a, b) => {
      if (a.status === 'started' && b.status !== 'started') return -1;
      if (b.status === 'started' && a.status !== 'started') return 1;

      const scoreA = getBookingScore(a);
      const scoreB = getBookingScore(b);
      if (scoreA !== scoreB) return scoreA - scoreB;

      return new Date(a.createdAt) - new Date(b.createdAt);
    });

    res.json(bookings);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: err.message });
  }
});

// @route   GET api/booking/check-premium-availability/:barberId
router.get('/check-premium-availability/:barberId', auth, async (req, res) => {
  try {
    const queryDate = new Date(req.query.date); queryDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(queryDate); nextDay.setDate(nextDay.getDate() + 1);

    const barber = await User.findById(req.params.barberId);
    if (!barber) return res.status(404).json({ msg: 'Not found' });

    const count = await Booking.countDocuments({ barberId: barber._id, date: { $gte: queryDate, $lt: nextDay }, status: { $ne: 'cancelled' } });
    if (count < barber.maxAppointmentsPerDay) return res.json({ type: 'free', count: barber.maxAppointmentsPerDay - count });

    const replaceable = await Booking.countDocuments({ barberId: barber._id, date: { $gte: queryDate, $lt: nextDay }, status: { $nin: ['started', 'completed', 'cancelled'] }, appointmentType: { $in: ['Basic', 'Walk-in'] } });
    res.json({ type: 'premium', count: replaceable });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: err.message });
  }
});

// @route   GET api/booking/website/barber-queue/:barberId (Public)
router.get('/website/barber-queue/:barberId', async (req, res) => {
  try {
    const { barberId } = req.params;
    const { date } = req.query;
    if (!date) return res.status(400).json({ msg: 'Date required' });

    const queryDate = new Date(date); queryDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(queryDate); nextDay.setDate(nextDay.getDate() + 1);

    const bookings = await Booking.find({
      barberId, date: { $gte: queryDate, $lt: nextDay }, status: { $ne: 'cancelled' },
    }).populate('userId', 'name _id').populate('services', 'name price').sort({ createdAt: 1 });

    bookings.sort((a, b) => {
      if (a.status === 'started') return -1;
      if (b.status === 'started') return 1;
      const scoreA = getBookingScore(a);
      const scoreB = getBookingScore(b);
      return scoreA - scoreB;
    });
    res.json(bookings);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: err.message });
  }
});

// @route   GET api/booking/public/:id
router.get('/public/:id', async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('barberId', 'name email phone address rating reviews profilePicture shopName shopAddress shopPhone')
      .populate('userId', 'name email profilePicture phone gender language');

    if (!booking) return res.status(404).json({ msg: 'Booking not found' });

    // For public view, we still select +otp but we might want to be careful.
    // However, the receipt needs the OTP to be useful.
    const bookingResponse = await Booking.findById(booking._id).select('+otp').populate('barberId', 'name email phone address rating reviews profilePicture shopName shopAddress shopPhone').populate('userId', 'name email profilePicture phone gender language');
    res.json(bookingResponse);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: err.message });
  }
});

// @route   GET api/booking/public/barber-queue/:barberId
router.get('/public/barber-queue/:barberId', async (req, res) => {
  try {
    const { barberId } = req.params;
    const { date } = req.query;
    if (!date) return res.status(400).json({ msg: 'Date required' });

    const queryDate = new Date(date); queryDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(queryDate); nextDay.setDate(nextDay.getDate() + 1);

    const bookings = await Booking.find({
      barberId, date: { $gte: queryDate, $lt: nextDay }, status: { $ne: 'cancelled' },
    }).populate('userId', 'name _id').populate('services', 'name price').sort({ createdAt: 1 });

    bookings.sort((a, b) => {
      if (a.status === 'started') return -1;
      if (b.status === 'started') return 1;
      const scoreA = getBookingScore(a);
      const scoreB = getBookingScore(b);
      return scoreA - scoreB;
    });
    res.json(bookings);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: err.message });
  }
});

// @route   POST api/booking/public
router.post('/public', validate(schemas.createPublicBooking), async (req, res) => {
  const { barberId, date, time, services, totalPrice, appointmentType, customerInfo } = req.body;
  try {
    const barber = await User.findById(barberId);
    if (!barber) return res.status(404).json({ msg: 'Barber not found' });

    // Check availability
    if (barber.isAvailable === false) {
      return res.status(400).json({ msg: 'Barber is currently offline and not accepting new bookings.' });
    }

    const today = new Date(date); today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
    const count = await Booking.countDocuments({ barberId, date: { $gte: today, $lt: tomorrow }, status: { $ne: 'cancelled' } });

    if (count >= barber.maxAppointmentsPerDay && appointmentType !== 'Express') {
      return res.status(400).json({ msg: 'Fully booked' });
    }

    const newBooking = new Booking({
      barberId, date, time, services, totalPrice, appointmentType,
      isOfflineBooking: true, customerName: customerInfo.name, customerPhone: customerInfo.phone,
      paymentStatus: 'completed', status: 'pending'
    });
    const saved = await newBooking.save();

    if (barber) {
      const n = new Notification({ userId: barber._id, title: 'New Public Booking', message: `New booking from ${customerInfo.name}` });
      await n.save();
    }

    res.json(saved);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: err.message });
  }
});

// @route   PUT api/booking/update-payment/:id
router.put('/update-payment/:id', auth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ msg: 'Booking not found' });
    const { paymentStatus, paymentMethod, transactionId, paymentAmount } = req.body;
    if (paymentStatus) booking.paymentStatus = paymentStatus;
    if (paymentMethod) booking.paymentMethod = paymentMethod;
    if (transactionId) booking.transactionId = transactionId;
    if (paymentAmount) booking.paymentAmount = paymentAmount;
    await booking.save();
    res.json(booking);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: err.message });
  }
});

// @route   PUT api/booking/promote/:id
router.put('/promote/:id', auth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ msg: 'Booking not found' });
    if (booking.barberId.toString() !== req.user.id) return res.status(401).json({ msg: 'User not authorized' });

    booking.isPromoted = true;
    await booking.save();
    res.json(booking);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: err.message });
  }
});

module.exports = router;