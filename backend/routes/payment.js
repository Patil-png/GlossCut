const express = require('express');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const router = express.Router();
const mongoose = require('mongoose'); // Add mongoose import
const Booking = require('../models/Booking');
const User = require('../models/User');
const Notification = require('../models/Notification');
const SetkarCoinTransaction = require('../models/SetkarCoinTransaction');
const Shop = require('../models/Shop');
const ListingPlace = require('../models/ListingPlace');
const auth = require('../middleware/auth');
// IMPORT DECRYPT for safety when using user names in notifications
const { decrypt } = require('../utils/EncryptionService');
const validate = require('../middleware/validate');
const schemas = require('../utils/validationSchemas');

// Ultra-efficient in-memory cache for payment operations
const paymentCache = new Map();
const PAYMENT_CACHE_DURATION = 10 * 60 * 1000; // 10 minutes for payment data

// Cache management functions
const getPaymentCached = (key) => {
  const cached = paymentCache.get(key);
  if (cached && Date.now() - cached.timestamp < PAYMENT_CACHE_DURATION) {
    return cached.data;
  }
  paymentCache.delete(key);
  return null;
};

const setPaymentCached = (key, data) => {
  paymentCache.set(key, { data, timestamp: Date.now() });
  // Prevent memory leaks - limit cache size
  if (paymentCache.size > 50) {
    const firstKey = paymentCache.keys().next().value;
    paymentCache.delete(firstKey);
  }
};

console.log('RAZORPAY_KEY_ID:', process.env.RAZORPAY_KEY_ID);
console.log('RAZORPAY_KEY_SECRET:', process.env.RAZORPAY_KEY_SECRET ? 'Loaded' : 'Not Loaded');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Nodemailer transporter setup
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

// @route   GET api/payment/config
// @desc    Get public payment configurations (Razorpay Key ID)
// @access  Private
router.get('/config', auth, (req, res) => {
  res.json({
    key: process.env.RAZORPAY_KEY_ID
  });
});

router.post('/order', validate(schemas.createOrder), async (req, res) => {
  try {
    const { amount, currency, receipt } = req.body;
    const options = {
      amount: amount * 100, // amount in smallest currency unit (paise)
      currency,
      receipt,
    };
    const order = await razorpay.orders.create(options);
    res.json(order);
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    res.status(500).send('Error creating order');
  }
});

router.post('/verify', auth, validate(schemas.verifyPayment), async (req, res) => {
  try {
    const { order_id, payment_id, signature, bookingId } = req.body;
    const body = order_id + '|' + payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    if (expectedSignature === signature) {
      const booking = await Booking.findById(bookingId);
      if (!booking) {
        return res.status(404).json({ msg: 'Booking not found' });
      }

      const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
      booking.paymentStatus = 'completed';
      booking.otp = otp;
      // If the booking was already accepted (status is 'pending' after barber acceptance),
      // and now payment is completed, change status to 'confirmed'.
      if (booking.status === 'pending') {
        booking.status = 'confirmed';
      }
      await booking.save();

      // Send notification to barber
      const barber = await User.findById(booking.barberId);
      if (barber) {
        // Safe Decryption of User Name
        const userName = decrypt(req.user.name);
        const newNotification = new Notification({
          userId: barber._id,
          title: 'Payment Received',
          message: `Payment of ₹${booking.totalPrice} received from ${userName} for booking on ${new Date(booking.date).toLocaleDateString()}.`,
        });
        await newNotification.save();
      }

      res.json({ status: 'success', message: 'Payment verified and booking updated' });
    } else {
      res.status(400).json({ status: 'failure', message: 'Payment verification failed' });
    }
  } catch (error) {
    console.error('Error verifying Razorpay payment:', error);
    res.status(500).send('Error verifying payment');
  }
});

// @route   POST api/payment/dummy-payment
// @desc    Simulate a successful payment for testing
// @access  Private
router.post('/dummy-payment', auth, validate(schemas.dummyPayment), async (req, res) => {
  try {
    const { bookingId, coinsUsed } = req.body; // Receive coinsUsed from frontend
    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return res.status(404).json({ msg: 'Booking not found' });
    }

    // Deduct Setkar coins if used
    if (coinsUsed && coinsUsed > 0) {
      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ msg: 'User not found for coin deduction.' });
      }
      if (user.setkarCoins < coinsUsed) {
        return res.status(400).json({ msg: 'Insufficient Setkar Coins for redemption.' });
      }
      user.setkarCoins -= coinsUsed;
      await user.save();

      // Create transaction record for coin redemption
      const redemptionTransaction = new SetkarCoinTransaction({
        userId: user._id,
        type: 'redeem',
        amount: coinsUsed,
        description: `Redeemed ${coinsUsed} Setkar Coins for booking payment`,
      });
      await redemptionTransaction.save();
    }

    // Add 0.5 Setkar Coins as cashback after successful payment
    const user = await User.findById(req.user.id); // Re-fetch user to ensure latest balance
    if (user) {
      user.setkarCoins = (user.setkarCoins || 0) + 0.5;
      await user.save();
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
    booking.paymentStatus = 'completed';
    booking.otp = otp;
    // If the booking was already accepted (status is 'pending' after barber acceptance),
    // and now payment is completed, change status to 'confirmed'.
    if (booking.status === 'pending') {
      booking.status = 'confirmed';
    }
    await booking.save();

    // Send notification to barber
    const barber = await User.findById(booking.barberId);
    if (barber) {
      // Safe Decryption of User Name
      const userName = decrypt(req.user.name);
      const newNotification = new Notification({
        userId: barber._id,
        title: 'Payment Received',
        message: `Payment of ₹${booking.totalPrice} received from ${userName} for booking on ${new Date(booking.date).toLocaleDateString()}.`,
      });
      await newNotification.save();
    }

    res.json({ status: 'success', message: 'Dummy payment successful and booking updated', otp });
  } catch (error) {
    console.error('Error processing dummy payment:', error);
    res.status(500).send('Error processing dummy payment');
  }
});

// @route   POST api/payment/book-without-payment
// @desc    Create a booking without payment
// @access  Private
router.post('/book-without-payment', auth, validate(schemas.bookWithoutPayment), async (req, res) => {
  try {
    console.log('Booking request body:', req.body);
    const { barberId, services, date, time, totalPrice, otp } = req.body; // Include otp in destructuring
    console.log('Booking with barberId:', barberId);

    // Concurrency check
    const existingBooking = await Booking.findOne({ barberId, date, time });
    if (existingBooking) {
      return res.status(409).json({ msg: 'This time slot is no longer available. Please choose another time.' });
    }

    const newBooking = new Booking({
      userId: req.user.id,
      barberId: barberId,
      services,
      date,
      time,
      totalPrice,
      otp, // Save the OTP
      status: 'pending',
    });

    await newBooking.save();

    // Send notification to barber
    const barber = await User.findById(barberId);
    if (barber) {
      const serviceNames = services.map(service => service.name).join(', ');
      const formattedDate = new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      const [timePart, ampm] = time.split(' ');
      let [hours, minutes, seconds] = timePart.split(':');
      if (ampm === 'pm' && hours !== '12') {
        hours = parseInt(hours, 10) + 12;
      }
      if (ampm === 'am' && hours === '12') {
        hours = '00';
      }
      const formattedTime = new Date(`${date.slice(0, 10)}T${hours}:${minutes}:${seconds}`).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: 'numeric',
        hour12: true,
      });

      // Safe Decryption of User Name
      const userName = decrypt(req.user.name);
      const newNotification = new Notification({
        userId: barber._id,
        title: 'New Booking',
        message: `You have a new booking from ${userName} for ${serviceNames} on ${formattedDate}.`,
      });
      await newNotification.save();
    }

    res.json({ status: 'success', message: 'Booking created successfully' });
  } catch (error) {
    console.error('Error creating booking without payment:', error);
    res.status(500).json({ msg: 'Error creating booking' });
  }
});

router.post('/send-otp', validate(schemas.sendOtp), async (req, res) => {
  console.log('Received request to send OTP');
  console.log('GMAIL_USER:', process.env.GMAIL_USER);
  console.log('GMAIL_PASS:', process.env.GMAIL_PASS ? 'Loaded' : 'Not Loaded');

  try {
    const { email, otp } = req.body;
    console.log(`Sending OTP ${otp} to ${email}`);

    const mailOptions = {
      from: process.env.GMAIL_USER,
      to: email,
      subject: 'Your Booking OTP',
      text: `Your OTP for booking confirmation is: ${otp}`,
    };

    await transporter.sendMail(mailOptions);
    console.log('OTP email sent successfully');
    res.json({ status: 'success', message: 'OTP sent successfully' });
  } catch (error) {
    console.error('Error sending OTP email:', error);
    res.status(500).send('Error sending OTP email');
  }
});

// --- CONFIGURATION & CONSTANTS ---
const TIER_PRICES = {
  1: 999, 2: 899, 3: 899, 4: 699, 5: 599,
  6: 499, 7: 399, 8: 299, 9: 199, 10: 99
};
// Note: Some tiers might have different names/prices across categories, 
// so we'll treat tierId as the primary key.

// --- NEW: LISTING TIER PAYMENT ROUTES ---

/**
 * @route   POST api/payment/listing-order
 * @desc    Create a Razorpay order for listing tier purchase
 * @access  Private (Shop Owner)
 */
router.post('/listing-order', auth, validate(schemas.listingOrder), async (req, res) => {
  try {
    const { tierId, price, category } = req.body;

    // SECURITY: Server-side Price Validation (Prevent manipulation)
    const expectedPrice = TIER_PRICES[tierId];
    if (!expectedPrice || Number(price) !== expectedPrice) {
      console.warn(`🚨 [Fraud Alert] Price mismatch for User: ${req.user.id}. Expected: ${expectedPrice}, Received: ${price}`);
      return res.status(400).json({ msg: 'Invalid price for selected tier. Please refresh.' });
    }

    // Verify if place is already booked (Pre-check)
    const conflictingLock = await ListingPlace.findOne({ tierId, category });
    if (conflictingLock && conflictingLock.lockedBy.toString() !== req.user.id) {
      return res.status(400).json({ msg: 'This place is already booked by another shop.' });
    }

    const options = {
      amount: Math.round(price * 100), // Ensure it's an integer
      currency: "INR",
      receipt: `L_${req.user.id.toString().slice(-6)}_${tierId}_${Date.now().toString().slice(-6)}`,
      notes: { tierId: String(tierId), category, userId: String(req.user.id) }
    };

    console.log('🔹 [Razorpay Backend] Creating order with options:', options);

    try {
      const order = await razorpay.orders.create(options);
      console.log('✅ [Razorpay Backend] Order created successfully:', order.id);
      res.json(order);
    } catch (razorError) {
      console.error('❌ [Razorpay Backend] SDK Error:', razorError);
      res.status(500).json({
        msg: 'Razorpay SDK Error',
        error: razorError.description || razorError.message || razorError
      });
    }
  } catch (err) {
    console.error('🔥 [Listing Order Final Catch]:', err);
    res.status(500).send('Internal Server Error creating listing order');
  }
});

/**
 * @route   POST api/payment/verify-listing
 * @desc    Verify Razorpay payment and activate shop listing
 * @access  Private (Shop Owner)
 */
router.post('/verify-listing', auth, validate(schemas.verifyListing), async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, tierId, price, category } = req.body;

    // 1. Verify Signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      console.warn(`🚨 [Security Alert] Signature verification failed for Order: ${razorpay_order_id}`);
      return res.status(400).json({ msg: 'Invalid payment signature. Fraud detected.' });
    }

    // 2. Extra Security: Verify order amount and notes via Razorpay API
    const orderData = await razorpay.orders.fetch(razorpay_order_id);

    // Idempotency check: Ensure the order hasn't been fulfilled yet
    if (orderData.notes && orderData.notes.fulfilled === 'true') {
      return res.status(200).json({ success: true, msg: 'Order already processed.' });
    }

    // SECURITY: Cross-reference tier and category with Order Notes
    if (
      String(orderData.notes.tierId) !== String(tierId) ||
      orderData.notes.category !== category
    ) {
      console.warn(`🚨 [Fraud Alert] Order Data Mismatch! User: ${req.user.id}. Order Tier: ${orderData.notes.tierId}, Req Tier: ${tierId}`);
      return res.status(400).json({ msg: 'Order data does not match payment. Fraud blocked.' });
    }

    // Ensure the amount in the order matches the expected price
    const expectedAmount = TIER_PRICES[tierId] * 100;
    if (orderData.amount !== expectedAmount) {
      return res.status(400).json({ msg: 'Payment amount mismatch. Scam prevented.' });
    }

    // 3. Activate Listing (Replicating logic from shop.js listing-place)
    let shop = await Shop.findOne({ owner: req.user.id });
    if (!shop) {
      return res.status(404).json({ msg: 'Shop not found' });
    }

    // Release current user's existing lock for this category
    await ListingPlace.findOneAndDelete({ lockedBy: req.user.id, category });

    // Create and save new listing
    const listingPlace = new ListingPlace({
      tierId,
      category,
      lockedBy: req.user.id,
      price,
      duration: 30, // Standard 30 days
      lockedAt: new Date()
    });
    await listingPlace.save();

    shop.selectedListingPlace = listingPlace._id;
    shop.listingConfirmed = true; // Mark as confirmed
    await shop.save();

    // Final Step: Mark order as fulfilled in Razorpay Notes (Internal Audit)
    try {
      await razorpay.orders.edit(razorpay_order_id, {
        notes: { ...orderData.notes, fulfilled: 'true', activatedAt: new Date().toISOString() }
      });
    } catch (e) {
      console.error('Non-critical: Failed to mark order as fulfilled in RZP notes');
    }

    res.json({ success: true, listingPlace });
  } catch (err) {
    console.error('[Listing Verification Error]', err);
    res.status(500).send('Verification Error');
  }
});

module.exports = router;