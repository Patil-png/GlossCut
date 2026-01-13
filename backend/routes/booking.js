const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const Notification = require('../models/Notification');
const User = require('../models/User');
const SetkarCoinTransaction = require('../models/SetkarCoinTransaction');
const auth = require('../middleware/auth');

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

  if (typeLower.includes('express')) priorityWeight = 0;       
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
  return higherPriorityBookings.some(booking => getPriorityValue(booking) < currentPriority);
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
      const notification = new Notification({ userId: user._id, title: 'Booking Confirmed', message: `Your booking with ${req.user.name} has been confirmed.` });
      await notification.save();
      const io = req.app.get('io');
      io.to(`user_${booking.userId}`).emit('notification', notification.toObject());
    }
    res.json(updatedBooking);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: err.message });
  }
});

// @route   POST api/booking/verify-otp-and-start/:id
router.post('/verify-otp-and-start/:id', auth, async (req, res) => {
  try {
    const { otp } = req.body;
    const booking = await Booking.findById(req.params.id).select('+otp');

    if (!booking) return res.status(404).json({ msg: 'Booking not found' });
    if (booking.barberId.toString() !== req.user.id) return res.status(401).json({ msg: 'User not authorized' });

    if (!booking.isOfflineBooking) {
      if (booking.otp !== otp) return res.status(400).json({ msg: 'Invalid OTP' });
    }

    booking.status = 'started';
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
router.put('/decline/:id', auth, async (req, res) => {
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
        if(displacedUser) {
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
        const n = new Notification({ userId: user._id, title: 'Booking Cancelled', message: `Your booking was cancelled: ${booking.cancellationReason}` });
        await n.save();
        const io = req.app.get('io');
        if(io) io.to(`user_${booking.userId}`).emit('notification', n.toObject());
    }
    res.json(updatedBooking);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: err.message });
  }
});

// @route   PUT api/booking/cancel/:id
router.put('/cancel/:id', auth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ msg: 'Booking not found' });
    if (booking.userId.toString() !== req.user.id) return res.status(401).json({ msg: 'User not authorized' });

    const higherPriority = await Booking.find({
        barberId: booking.barberId, date: booking.date, paymentStatus: 'pending', status: { $in: ['confirmed', 'pending'] }, _id: { $ne: booking._id }
    });
    if (hasBlockingHigherPriorityBookings(booking, higherPriority)) return res.status(400).json({ msg: 'Cannot cancel. Higher priority pending.' });

    if (booking.paymentStatus === 'completed') return res.status(400).json({ msg: 'Cannot cancel paid booking' });

    booking.status = 'cancelled';
    await booking.save();

    const displaced = await Booking.findOne({ barberId: booking.barberId, status: 'cancelled', cancellationReason: 'Cancelled due to a higher priority booking.' }).sort({ createdAt: -1 });
    if (displaced) {
        displaced.status = 'confirmed';
        displaced.cancellationReason = '';
        await displaced.save();
    }

    const io = req.app.get('io');
    if(io) io.emit('bookingCancelled', booking);
    res.json(booking);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: err.message });
  }
});

// @route   PUT api/booking/cancel-pending/:id
router.put('/cancel-pending/:id', auth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ msg: 'Booking not found' });
    if (booking.userId.toString() !== req.user.id) return res.status(401).json({ msg: 'User not authorized' });
    if (booking.paymentStatus !== 'pending') return res.status(400).json({ msg: 'Not pending payment' });

    const displaced = await Booking.findOne({ barberId: booking.barberId, status: 'cancelled', cancellationReason: 'Cancelled due to a higher priority booking.' }).sort({ createdAt: -1 });
    if (displaced) {
        displaced.status = 'confirmed';
        displaced.cancellationReason = '';
        await displaced.save();
    }

    booking.status = 'cancelled';
    await booking.save();
    res.json({ msg: 'Booking cancelled' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: err.message });
  }
});

// @route   POST api/booking/verify-otp
router.post('/verify-otp', auth, async (req, res) => {
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

    const higherPriority = await Booking.find({
        barberId: booking.barberId, date: booking.date, paymentStatus: 'pending', status: { $in: ['confirmed', 'pending', 'started'] }, _id: { $ne: booking._id }
    });
    if (hasBlockingHigherPriorityBookings(booking, higherPriority)) return res.status(400).json({ msg: 'Cannot complete. Higher priority pending.' });

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
    }

    const barber = await User.findById(booking.barberId);
    if (barber) {
        const identifier = updatedBooking.isOfflineBooking ? updatedBooking.customerName : updatedBooking.userId.name;
        const bn = new Notification({ userId: barber._id, title: 'Booking Completed', message: `Booking for ${identifier} completed.` });
        await bn.save();
    }

    res.json(updatedBooking);
  } catch (err) {
    console.error(err.message);
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
    const dayStart = new Date(booking.date); dayStart.setHours(0,0,0,0);
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
    const myCurrentScore = getBookingScore(booking);
    const nextBooking = sortedQueue.find(b => getBookingScore(b) >= myCurrentScore);

    if (booking.appointmentType === 'Express') {
        const isNextBasic = nextBooking && getBookingScore(nextBooking) >= 2000;
        if (isNextBasic) {
            const targetScore = getBookingScore(nextBooking);
            const myBaseScore = getBookingScore({ ...booking.toObject(), tempDelayMinutes: 0 });
            newDelay = (targetScore - myBaseScore) + 1;
        } else {
            const currentDelay = booking.tempDelayMinutes || 0;
            newDelay = currentDelay + 20; 
        }
    } else {
        if (!nextBooking) return res.status(400).json({ msg: 'Already last' });
        const targetScore = getBookingScore(nextBooking);
        const myBaseScore = getBookingScore({ ...booking.toObject(), tempDelayMinutes: 0 });
        newDelay = (targetScore - myBaseScore) + 1;
    }
    
    if(newDelay < 0) newDelay = 1;
    if(newDelay > 3500) newDelay = 3500;

    booking.tempDelayMinutes = newDelay;
    await booking.save();

    res.json({ msg: 'Swapped successfully', booking });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: err.message });
  }
});

// @route   POST api/booking (Create Booking)
router.post('/', auth, async (req, res) => {
  const { barberId, date, time, services, totalPrice, appointmentType, isOfflineBooking, customerName, customerPhone } = req.body;
  try {
    const barber = await User.findById(barberId);
    if (!barber) return res.status(404).json({ msg: 'Barber not found' });

    const today = new Date(date); today.setHours(0,0,0,0);
    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
    const count = await Booking.countDocuments({ barberId, date: { $gte: today, $lt: tomorrow }, status: { $ne: 'cancelled' } });
    
    if (count >= barber.maxAppointmentsPerDay) {
        if (appointmentType !== 'Express') return res.status(400).json({ msg: 'Fully booked' });
        
        const toCancel = await Booking.findOne({ barberId, date: { $gte: today, $lt: tomorrow }, status: { $nin: ['started','completed','cancelled']}, appointmentType: 'Basic' }).sort({ createdAt: -1 });
        if(toCancel) {
            toCancel.status = 'cancelled';
            toCancel.cancellationReason = 'Cancelled due to a higher priority booking.';
            await toCancel.save();
            const cUser = await User.findById(toCancel.userId);
            if(cUser) {
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
    const newBooking = new Booking({
        userId: isOfflineBooking ? undefined : req.user.id,
        barberId, date, time, services, totalPrice, appointmentType,
        isOfflineBooking: isOfflineBooking || false,
        customerName, customerPhone,
        paymentStatus: isOfflineBooking ? 'completed' : 'pending',
        otp,
        tempDelayMinutes: 0
    });

    // 2. CHECK FOR EXISTING SKIPPED BOOKINGS OF SAME TYPE
    // If the queue has delayed people, this new booking (0 delay) might accidental cut in front.
    // We fetch current active bookings to see if we need to add a "natural delay".
    const activeSameTypeBookings = await Booking.find({
        barberId,
        date: { $gte: today, $lt: tomorrow },
        status: { $in: ['confirmed', 'started'] },
        appointmentType: appointmentType // STRICTLY SAME TYPE
    });

    if (activeSameTypeBookings.length > 0) {
        let maxEffectiveScore = 0;
        
        // Find the "slowest" person in this category
        activeSameTypeBookings.forEach(b => {
             const score = getBookingScore(b);
             if (score > maxEffectiveScore) maxEffectiveScore = score;
        });

        const myNaturalScore = getBookingScore(newBooking);

        // If my natural time puts me ABOVE (lower score) the person at the bottom,
        // it means I am cutting in front of someone who was delayed.
        // We add just enough delay to put me 1 point behind them.
        if (myNaturalScore <= maxEffectiveScore) {
             newBooking.tempDelayMinutes = (maxEffectiveScore - myNaturalScore) + 1;
        }
    }

    // 3. Save
    const saved = await newBooking.save();
    
    const barberNotifUser = await User.findById(barberId);
    if(barberNotifUser) {
        const n = new Notification({ userId: barberNotifUser._id, title: 'New Booking', message: `New booking from ${isOfflineBooking ? customerName : req.user.name}` });
        await n.save();
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
    const queryDate = new Date(req.query.date); queryDate.setHours(0,0,0,0);
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

    const queryDate = new Date(date); queryDate.setHours(0,0,0,0);
    const nextDay = new Date(queryDate); nextDay.setDate(nextDay.getDate() + 1);

    const bookings = await Booking.find({
      barberId,
      date: { $gte: queryDate, $lt: nextDay },
      status: { $ne: 'cancelled' },
    })
    .populate('userId', 'name _id phone')
    .populate('services', 'name price')
    .select('customerName isOfflineBooking date time appointmentType totalPrice status services paymentStatus tempDelayMinutes skipCount createdAt');

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
    const queryDate = new Date(req.query.date); queryDate.setHours(0,0,0,0);
    const nextDay = new Date(queryDate); nextDay.setDate(nextDay.getDate() + 1);
    
    const barber = await User.findById(req.params.barberId);
    if(!barber) return res.status(404).json({msg:'Not found'});

    const count = await Booking.countDocuments({ barberId: barber._id, date: { $gte: queryDate, $lt: nextDay }, status: { $ne: 'cancelled' } });
    if(count < barber.maxAppointmentsPerDay) return res.json({ type: 'free', count: barber.maxAppointmentsPerDay - count });

    const replaceable = await Booking.countDocuments({ barberId: barber._id, date: { $gte: queryDate, $lt: nextDay }, status: { $nin: ['started', 'completed', 'cancelled'] }, appointmentType: { $in: ['Basic'] } });
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

    const queryDate = new Date(date); queryDate.setHours(0,0,0,0);
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

// @route   GET api/booking/public/barber-queue/:barberId
router.get('/public/barber-queue/:barberId', async (req, res) => {
    try {
        const { barberId } = req.params;
        const { date } = req.query;
        if (!date) return res.status(400).json({ msg: 'Date required' });
    
        const queryDate = new Date(date); queryDate.setHours(0,0,0,0);
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
router.post('/public', async (req, res) => {
  const { barberId, date, time, services, totalPrice, appointmentType, customerInfo } = req.body;
  try {
    const barber = await User.findById(barberId);
    if (!barber) return res.status(404).json({ msg: 'Barber not found' });

    const today = new Date(date); today.setHours(0,0,0,0);
    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
    const count = await Booking.countDocuments({ barberId, date: { $gte: today, $lt: tomorrow }, status: { $ne: 'cancelled' } });

    if (count >= barber.maxAppointmentsPerDay && appointmentType !== 'Express') {
        return res.status(400).json({ msg: 'Fully booked' });
    }

    const newBooking = new Booking({
        barberId, date, time, services, totalPrice, appointmentType,
        isOfflineBooking: true, customerName: customerInfo.name, customerPhone: customerInfo.phone,
        paymentStatus: 'pending', status: 'pending'
    });
    const saved = await newBooking.save();
    
    const barberNotifUser = await User.findById(barberId);
    if(barberNotifUser) {
        const n = new Notification({ userId: barberNotifUser._id, title: 'New Public Booking', message: `New booking from ${customerInfo.name}` });
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

module.exports = router;