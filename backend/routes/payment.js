const express = require('express');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const axios = require('axios');
const router = express.Router();
const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const User = require('../models/User');
const Notification = require('../models/Notification');
const SetkarCoinTransaction = require('../models/SetkarCoinTransaction');
const Shop = require('../models/Shop');
const ListingPlace = require('../models/ListingPlace');
const AdPlacement = require('../models/AdPlacement');
const ServiceArea = require('../models/ServiceArea');
const GlobalSettings = require('../models/GlobalSettings');
const auth = require('../middleware/auth');
const { decrypt } = require('../utils/EncryptionService');
const validate = require('../middleware/validate');
const schemas = require('../utils/validationSchemas');
const { Expo } = require('expo-server-sdk');
const expo = new Expo();
const { sendPushToUser } = require('../utils/webPushService');

// Ultra-efficient in-memory cache for payment operations
const paymentCache = new Map();
const PAYMENT_CACHE_DURATION = 10 * 60 * 1000;

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
  if (paymentCache.size > 50) {
    const firstKey = paymentCache.keys().next().value;
    paymentCache.delete(firstKey);
  }
};

// --- PhonePe v1 API Configuration (UAT Sandbox + Production) --- COMMENTED: no credentials
/*
const PHONEPE_MERCHANT_ID = process.env.PHONEPE_MERCHANT_ID;
const P_SALT_KEY = process.env.PHONEPE_SALT_KEY;
const P_SALT_INDEX = process.env.PHONEPE_SALT_INDEX;
const PHONEPE_URL = process.env.PHONEPE_ENV === 'prod'
  ? 'https://api.phonepe.com/apis/hermes'
  : 'https://api-preprod.phonepe.com/apis/pg-sandbox';
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://www.glosscut.com';
const BACKEND_URL = process.env.API_URL || 'https://api.glosscut.com';
*/
// -----------------------------


const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

router.get('/config', auth, (req, res) => {
  res.json({
    key: process.env.RAZORPAY_KEY_ID
  });
});

// --- PhonePe Routes (COMMENTED: no credentials, using Razorpay instead) ---
/*
router.post('/phonepe/order', auth, async (req, res) => {
  try {
    const { amount, bookingId } = req.body;
    const amountInPaise = Math.round(amount * 100);
    const transactionId = `T${Date.now()}_${bookingId.toString().slice(-6)}`;

    const payload = {
      merchantId: PHONEPE_MERCHANT_ID,
      merchantTransactionId: transactionId,
      merchantUserId: String(req.user.id),
      amount: amountInPaise,
      redirectUrl: `${BACKEND_URL}/api/payment/phonepe/redirect?bookingId=${bookingId}&transactionId=${transactionId}`,
      redirectMode: 'REDIRECT',
      callbackUrl: `${BACKEND_URL}/api/payment/phonepe/callback`,
      paymentInstrument: { type: 'PAY_PAGE' },
    };

    const payloadBase64 = Buffer.from(JSON.stringify(payload)).toString('base64');
    const stringToSign = payloadBase64 + '/pg/v1/pay' + P_SALT_KEY;
    const checksum = crypto.createHash('sha256').update(stringToSign).digest('hex') + '###' + P_SALT_INDEX;

    const response = await axios.post(`${PHONEPE_URL}/pg/v1/pay`, { request: payloadBase64 }, {
      headers: {
        'Content-Type': 'application/json',
        'X-VERIFY': checksum,
        'accept': 'application/json'
      }
    });

    if (response.data && response.data.success) {
      await Booking.findByIdAndUpdate(bookingId, { $set: { transactionId } });
      res.json({
        success: true,
        redirectUrl: response.data.data.instrumentResponse.redirectInfo.url,
        transactionId
      });
    } else {
      console.error('PhonePe order error response:', response.data);
      res.status(400).json({ success: false, msg: 'PhonePe init failed', details: response.data });
    }
  } catch (error) {
    console.error('PhonePe order error:', error.response?.data || error.message);
    res.status(500).json({ success: false, msg: 'Error creating PhonePe order' });
  }
});

router.get('/phonepe/redirect', async (req, res) => {
  const { transactionId, bookingId } = req.query;
  try {
    if (transactionId) {
      const stringToSign = `/pg/v1/status/${PHONEPE_MERCHANT_ID}/${transactionId}` + P_SALT_KEY;
      const checksum = crypto.createHash('sha256').update(stringToSign).digest('hex') + '###' + P_SALT_INDEX;

      const statusRes = await axios.get(
        `${PHONEPE_URL}/pg/v1/status/${PHONEPE_MERCHANT_ID}/${transactionId}`,
        {
          headers: {
            'Content-Type': 'application/json',
            'X-VERIFY': checksum,
            'X-MERCHANT-ID': PHONEPE_MERCHANT_ID
          }
        }
      );

      if (statusRes.data && statusRes.data.code === 'PAYMENT_SUCCESS') {
        const booking = await Booking.findById(bookingId);
        if (booking && booking.paymentStatus !== 'completed') {
          const otp = Math.floor(100000 + Math.random() * 900000).toString();
          booking.paymentStatus = 'completed';
          booking.status = 'confirmed';
          booking.paymentMethod = 'phonepe';
          booking.otp = otp;
          await booking.save();

          const io = req.app.get('io');
          if (io) {
            io.to(`barber_${booking.barberId.toString()}`).emit('new_booking', {
              bookingId: booking._id,
              customerName: booking.customerName || 'Customer',
              appointmentType: booking.appointmentType,
              time: booking.time,
              services: booking.services,
              status: 'confirmed'
            });
          }
        }
        return res.redirect(`${FRONTEND_URL}/booking-success/${bookingId}`);
      }
    }
  } catch (e) {
    console.error('PhonePe Redirect Error:', e.response?.data || e.message);
  }
  res.redirect(`${FRONTEND_URL}/all-services-search?payment=failed`);
});

router.post('/phonepe/callback', express.json(), async (req, res) => {
  try {
    // Verify Basic Auth credentials from PhonePe
    const authHeader = req.headers['authorization'] || '';
    const base64 = authHeader.replace('Basic ', '');
    const authDecoded = Buffer.from(base64, 'base64').toString('utf-8');
    const [user, pass] = authDecoded.split(':');
    if (user !== process.env.PHONEPE_WEBHOOK_USERNAME || pass !== process.env.PHONEPE_WEBHOOK_PASSWORD) {
      return res.status(401).send('Unauthorized');
    }

    const { response } = req.body;
    if (!response) return res.send('ok');

    const receivedChecksum = req.headers['x-verify'];
    const generatedChecksum = crypto.createHash('sha256').update(response + P_SALT_KEY).digest('hex') + '###' + P_SALT_INDEX;

    if (receivedChecksum !== generatedChecksum) return res.status(400).send('Invalid Checksum');

    const decoded = JSON.parse(Buffer.from(response, 'base64').toString('utf-8'));
    if (decoded.code === 'PAYMENT_SUCCESS') {
      const txId = decoded.data?.merchantTransactionId;
      const booking = await Booking.findOne({ transactionId: txId });
      if (booking && booking.paymentStatus !== 'completed') {
        booking.paymentStatus = 'completed';
        booking.status = 'confirmed';
        booking.paymentMethod = 'phonepe';
        booking.otp = Math.floor(100000 + Math.random() * 900000).toString();
        await booking.save();
      }
    }
    res.send('ok');
  } catch (error) {
    console.error('PhonePe callback error:', error);
    res.status(500).send('error');
  }
});
*/
// ----------------------


router.post('/order', validate(schemas.createOrder), async (req, res) => {
  try {
    const { amount, currency, receipt } = req.body;
    const options = {
      amount: Math.round(amount * 100),
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
      const orderData = await razorpay.orders.fetch(order_id);
      let booking = await Booking.findById(bookingId);

      if (!booking) {
        return res.status(404).json({ msg: 'Booking not found' });
      }

      const settings = await GlobalSettings.findOne() || { basicAppointmentFee: 9, expressAppointmentFee: 19 };
      let expectedAmount;

      // Log the current settings for debugging
      console.log(`[Payment Verify] Settings: Basic=${settings.basicAppointmentFee}, Express=${settings.expressAppointmentFee}`);
      console.log(`[Payment Verify] Booking ${bookingId}: Type=${booking.appointmentType}, TotalPrice=${booking.totalPrice}`);

      if (booking.appointmentType === 'Basic') {
        expectedAmount = Math.round(settings.basicAppointmentFee * 100);
      } else if (booking.appointmentType === 'Express') {
        expectedAmount = Math.round(settings.expressAppointmentFee * 100);
      } else {
        expectedAmount = Math.round(booking.totalPrice * 100);
      }

      // Check if amount matches. If it doesn't match the tier, check if it matches the booking total price.
      // This provides a fallback if tier prices changed or are being tested with different values.
      const isMatch = (orderData.amount === expectedAmount) || (orderData.amount === Math.round(booking.totalPrice * 100));

      if (!isMatch) {
        console.error(`🚨 [Amount Mismatch] Booking ${bookingId}: Expected Tier=${expectedAmount} or Total=${Math.round(booking.totalPrice * 100)}, Got ${orderData.amount}`);
        return res.status(400).json({ 
          status: 'failure', 
          message: 'Payment amount mismatch. Potential tampering detected.',
          details: { expected: expectedAmount, received: orderData.amount }
        });
      }


      if (booking && booking.status === 'cancelled' && booking.cancellationReason && booking.cancellationReason.includes('timeout')) {
        const conflictingBooking = await Booking.findOne({
          barberId: booking.barberId,
          date: booking.date,
          time: booking.time,
          status: { $ne: 'cancelled' },
          _id: { $ne: booking._id }
        });

        if (conflictingBooking) {
          return res.status(409).json({
            status: 'failure',
            message: 'Your payment was successful, but the slot was taken by someone else during the delay. Please contact support for a manual refund or rescheduling.',
            payment_id: payment_id
          });
        }
        booking.status = 'confirmed';
        booking.cancellationReason = '';
      }

      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      booking.paymentStatus = 'completed';
      booking.otp = otp;
      if (booking.status === 'pending') {
        booking.status = 'confirmed';
      }
      await booking.save();

      const finalCustomerName = booking.isOfflineBooking && booking.customerName
        ? booking.customerName
        : (req.user && req.user.name ? decrypt(req.user.name) : "Customer");

      const io = req.app.get('io');
      if (io) {
        io.to(`barber_${booking.barberId.toString()}`).emit('new_booking', {
          bookingId: booking._id,
          customerName: finalCustomerName,
          appointmentType: booking.appointmentType,
          time: booking.time,
          services: booking.services,
          status: 'confirmed'
        });
      }

      const barber = await User.findById(booking.barberId);
      if (barber) {
        const newNotification = new Notification({
          userId: barber._id,
          title: 'New Booking (Paid)',
          message: `Payment of ₹${booking.totalPrice} received from ${finalCustomerName} for ${booking.services.length} service(s). Status: Confirmed.`,
        });
        await newNotification.save();

        if (barber.expoPushToken && Expo.isExpoPushToken(barber.expoPushToken) && barber.notificationsEnabled !== false) {
          try {
            const notificationTitle = `Booking Confirmed • ₹${booking.totalPrice}`;
            const notificationBody = `${finalCustomerName} • ${booking.time}\nOnline • ${booking.services.length} service(s)\nAuto-accepted & Ready`;

            await expo.sendPushNotificationsAsync([{
              to: barber.expoPushToken,
              sound: 'default',
              title: notificationTitle,
              body: notificationBody,
              data: {
                type: 'booking_new',
                bookingId: booking._id.toString(),
                customerName: finalCustomerName,
                appointmentType: booking.appointmentType,
                time: booking.time,
                price: booking.totalPrice,
                isOffline: false,
                status: 'confirmed'
              },
              channelId: 'high_priority',
              priority: 'high',
            }]);
          } catch (error) {
            console.error('Push notification error (payment):', error.message);
          }
        }

        // --- NEW: Web Push to Barber (PWA) ---
        if (barber.webPushSubscription) {
          try {
            await sendPushToUser(barber, {
              title: `Booking Confirmed • ₹${booking.totalPrice}`,
              body: `${finalCustomerName} • ${booking.time}\nOnline • ${booking.services.length} service(s)`,
              icon: '/ic_stat_notification_icon.png',
              badge: '/ic_stat_notification_icon.png',
              url: '/dashboard',
              tag: 'booking_new'
            });
          } catch (pushErr) {
            console.error('Error sending web push to barber (verify):', pushErr.message);
          }
        }
      }

      // --- NEW: Web Push to Customer (Zomato style) ---
      if (req.user && req.user.id) {
        try {
          const customer = await User.findById(req.user.id);
          if (customer && customer.webPushSubscription) {
            await sendPushToUser(customer, {
              title: '✅ Booking Confirmed!',
              body: `Your appointment at ${barber ? barber.name : 'the salon'} is confirmed. Tap to track live.`,
              url: `/track-booking/${booking._id.toString()}`,
              tag: 'booking-status'
            });
          }
        } catch (pushErr) {
          console.error('Error sending web push to customer:', pushErr.message);
        }
      }

      res.json({ status: 'success', message: 'Payment verified and booking updated', otp });
    } else {
      res.status(400).json({ status: 'failure', message: 'Payment verification failed' });
    }
  } catch (error) {
    console.error('Error verifying Razorpay payment:', error);
    res.status(500).send('Error verifying payment');
  }
});

router.post('/dummy-payment', auth, validate(schemas.dummyPayment), async (req, res) => {
  try {
    const { bookingId, coinsUsed } = req.body;
    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return res.status(404).json({ msg: 'Booking not found' });
    }

    if (coinsUsed && coinsUsed > 0) {
      const user = await User.findById(req.user.id);
      if (!user) return res.status(404).json({ msg: 'User not found' });
      if (user.setkarCoins < coinsUsed) return res.status(400).json({ msg: 'Insufficient coins' });
      user.setkarCoins -= coinsUsed;
      await user.save();

      const redemptionTransaction = new SetkarCoinTransaction({
        userId: user._id,
        type: 'redeem',
        amount: coinsUsed,
        description: `Redeemed ${coinsUsed} Setkar Coins for booking payment`,
      });
      await redemptionTransaction.save();
    }

    const user = await User.findById(req.user.id);
    if (user) {
      user.setkarCoins = (user.setkarCoins || 0) + 0.5;
      await user.save();
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    booking.paymentStatus = 'completed';
    booking.otp = otp;
    if (booking.status === 'pending') {
      booking.status = 'confirmed';
    }
    await booking.save();

    const finalCustomerName = booking.isOfflineBooking && booking.customerName
      ? booking.customerName
      : (req.user && req.user.name ? decrypt(req.user.name) : "Customer");

    const io = req.app.get('io');
    if (io) {
      io.to(`barber_${booking.barberId.toString()}`).emit('new_booking', {
        bookingId: booking._id,
        customerName: finalCustomerName,
        appointmentType: booking.appointmentType,
        time: booking.time,
        services: booking.services,
        status: 'confirmed'
      });
    }

    const barber = await User.findById(booking.barberId);
    if (barber) {
      const newNotification = new Notification({
        userId: barber._id,
        title: 'New Booking (Paid)',
        message: `Payment (Dummy) of ₹${booking.totalPrice} received from ${finalCustomerName}. Status: Confirmed.`,
      });
      await newNotification.save();

      if (barber.expoPushToken && Expo.isExpoPushToken(barber.expoPushToken) && barber.notificationsEnabled !== false) {
        try {
          const notificationTitle = `Booking Confirmed (Test) • ₹${booking.totalPrice}`;
          const notificationBody = `${finalCustomerName} • ${booking.time}\nOnline • ${booking.services.length} service(s)\nAuto-accepted & Ready`;

          await expo.sendPushNotificationsAsync([{
            to: barber.expoPushToken,
            sound: 'default',
            title: notificationTitle,
            body: notificationBody,
            data: {
              type: 'booking_new',
              bookingId: booking._id.toString(),
              customerName: finalCustomerName,
              appointmentType: booking.appointmentType,
              time: booking.time,
              price: booking.totalPrice,
              isOffline: false,
              status: 'confirmed'
            },
            channelId: 'high_priority',
            priority: 'high',
          }]);
        } catch (error) {
          console.error('Push notification error (dummy payment):', error.message);
        }
      }

      // --- NEW: Web Push to Barber (PWA) ---
      if (barber.webPushSubscription) {
        try {
          await sendPushToUser(barber, {
            title: `Booking Confirmed (Test) • ₹${booking.totalPrice}`,
            body: `${finalCustomerName} • ${booking.time}\nOnline • ${booking.services.length} service(s)`,
            icon: '/ic_stat_notification_icon.png',
            badge: '/ic_stat_notification_icon.png',
            url: '/dashboard',
            tag: 'booking_new'
          });
        } catch (pushErr) {
          console.error('Error sending web push to barber (dummy):', pushErr.message);
        }
      }
    }

    // --- NEW: Web Push to Customer (Zomato style) ---
    if (req.user && req.user.id) {
      try {
        const customer = await User.findById(req.user.id);
        if (customer && customer.webPushSubscription) {
          await sendPushToUser(customer, {
            title: '✅ Booking Confirmed!',
            body: `Your appointment at ${barber ? barber.name : 'the salon'} is confirmed. Tap to track live.`,
            url: `/track-booking/${booking._id.toString()}`,
            tag: 'booking-status'
          });
        }
      } catch (pushErr) {
        console.error('Error sending web push to customer:', pushErr.message);
      }
    }

    res.json({ status: 'success', message: 'Dummy payment successful', otp });
  } catch (error) {
    console.error('Error processing dummy payment:', error);
    res.status(500).send('Error processing dummy payment');
  }
});

router.post('/book-without-payment', auth, validate(schemas.bookWithoutPayment), async (req, res) => {
  try {
    const { barberId, services, date, time, totalPrice, otp } = req.body;
    const existingBooking = await Booking.findOne({ barberId, date, time });
    if (existingBooking) return res.status(409).json({ msg: 'Slot already taken' });

    const newBooking = new Booking({
      userId: req.user.id,
      barberId,
      services,
      date,
      time,
      totalPrice,
      otp,
      status: 'pending',
    });

    await newBooking.save();

    const barber = await User.findById(barberId);
    if (barber) {
      const userName = decrypt(req.user.name);
      const newNotification = new Notification({
        userId: barber._id,
        title: 'New Booking',
        message: `New booking from ${userName} for ${services.map(s => s.name).join(', ')} on ${date}.`,
      });
      await newNotification.save();
    }

    res.json({ status: 'success', message: 'Booking created' });
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({ msg: 'Error creating booking' });
  }
});

router.post('/send-otp', validate(schemas.sendOtp), async (req, res) => {
  try {
    const { email, otp } = req.body;
    const mailOptions = {
      from: process.env.GMAIL_USER,
      to: email,
      subject: 'Your Booking OTP',
      text: `Your OTP is: ${otp}`,
    };
    await transporter.sendMail(mailOptions);
    res.json({ status: 'success', message: 'OTP sent' });
  } catch (error) {
    console.error('Error sending OTP:', error);
    res.status(500).send('Error sending OTP');
  }
});

const TIER_PRICES = { 1: 999, 2: 799 };

router.get('/listing-availability', auth, async (req, res) => {
  try {
    const { areaId, category } = req.query;
    if (!category) return res.status(400).json({ msg: 'Category is required' });

    const lockedPlaces = await ListingPlace.find({
      areaId: areaId === 'default' ? null : areaId,
      category
    }).select('tierId lockedBy lockedAt duration price');

    const availability = {};
    lockedPlaces.forEach(lp => {
      const isMine = lp.lockedBy.toString() === req.user.id;
      availability[lp.tierId] = {
        isBooked: true,
        isMine,
        ...(isMine ? {
          lockedAt: lp.lockedAt,
          duration: lp.duration,
          price: lp.price
        } : {})
      };
    });

    const userActivePlan = await ListingPlace.findOne({
      areaId: areaId === 'default' ? null : areaId,
      lockedBy: req.user.id
    }).select('category tierId lockedAt price duration');

    res.json({
      availability,
      userActivePlan: userActivePlan ? {
        category: userActivePlan.category,
        tierId: userActivePlan.tierId,
        lockedAt: userActivePlan.lockedAt,
        price: userActivePlan.price,
        duration: userActivePlan.duration
      } : null
    });
  } catch (err) {
    console.error('Error fetching availability:', err);
    res.status(500).send('Server Error');
  }
});

router.post('/listing-order', auth, validate(schemas.listingOrder), async (req, res) => {
  try {
    const { tierId, price, category, areaId } = req.body;

    const existingOwnListing = await ListingPlace.findOne({
      areaId: areaId === 'default' ? null : areaId,
      lockedBy: req.user.id
    });

    if (existingOwnListing) {
      return res.status(400).json({ msg: `You already have an active plan (${existingOwnListing.category}) in this area.` });
    }

    const conflictingLock = await ListingPlace.findOne({
      tierId,
      category,
      areaId: areaId === 'default' ? null : areaId,
      lockedBy: { $ne: req.user.id }
    });

    if (conflictingLock) {
      return res.status(400).json({ msg: 'This slot was just booked by another shop.' });
    }

    let expectedPrice = TIER_PRICES[tierId];
    if (areaId) {
      const area = await ServiceArea.findById(areaId);
      if (area) {
        const areaPricing = area.tierPricing.find(t => t.tierId === tierId);
        if (areaPricing) expectedPrice = areaPricing.price;
      }
    }

    if (!expectedPrice || Number(price) !== expectedPrice) {
      return res.status(400).json({ msg: 'Invalid price.' });
    }

    const options = {
      amount: Math.round(price * 100),
      currency: "INR",
      receipt: `L_${req.user.id.toString().slice(-6)}_${tierId}_${Date.now().toString().slice(-6)}`,
      notes: { tierId: String(tierId), category, userId: String(req.user.id), areaId: areaId || "" }
    };

    const order = await razorpay.orders.create(options);
    res.json(order);
  } catch (err) {
    console.error('Error creating listing order:', err);
    res.status(500).send('Server Error');
  }
});

router.post('/verify-listing', auth, validate(schemas.verifyListing), async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, tierId, price, category, areaId } = req.body;
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET).update(body.toString()).digest("hex");

    if (expectedSignature !== razorpay_signature) return res.status(400).json({ msg: 'Invalid signature.' });

    const orderData = await razorpay.orders.fetch(razorpay_order_id);
    if (orderData.notes && orderData.notes.fulfilled === 'true') return res.status(200).json({ success: true });

    if (String(orderData.notes.tierId) !== String(tierId) || orderData.notes.category !== category) {
      return res.status(400).json({ msg: 'Order mismatch.' });
    }

    const finalExistingCheck = await ListingPlace.findOne({
      areaId: areaId || null,
      lockedBy: req.user.id,
      tierId: { $ne: tierId }
    });

    if (finalExistingCheck) {
      return res.status(400).json({ msg: `Multiple placements (${finalExistingCheck.category}) in this area are not allowed.` });
    }

    const conflictingLock = await ListingPlace.findOne({
      tierId,
      category,
      areaId: areaId || null,
      lockedBy: { $ne: req.user.id }
    });

    if (conflictingLock) return res.status(409).json({ msg: 'Slot taken by another user.' });

    let shop = await Shop.findOne({ owner: req.user.id });
    if (!shop) return res.status(404).json({ msg: 'Shop not found' });

    await ListingPlace.findOneAndDelete({ lockedBy: req.user.id, areaId: areaId || null });

    const listingPlace = new ListingPlace({
      tierId,
      category,
      lockedBy: req.user.id,
      price,
      duration: 30,
      lockedAt: new Date(),
      areaId: areaId || null
    });
    await listingPlace.save();

    shop.selectedListingPlaces = [listingPlace._id]; // Only one placement
    shop.listingConfirmed = true;
    await shop.save();

    try {
      await razorpay.orders.edit(razorpay_order_id, {
        notes: { ...orderData.notes, fulfilled: 'true', activatedAt: new Date().toISOString() }
      });
    } catch (e) { }

    res.json({ success: true, listingPlace });
  } catch (err) {
    console.error('Verification error:', err);
    res.status(500).send('Server Error');
  }
});

router.post('/ad-order', auth, validate(schemas.adOrder), async (req, res) => {
  try {
    const { adId, price } = req.body;
    const ad = await AdPlacement.findById(adId);
    if (!ad || ad.barberId.toString() !== req.user.id) return res.status(404).json({ msg: 'Ad not found' });
    if (Math.round(ad.price) !== Math.round(price)) return res.status(400).json({ msg: 'Price mismatch' });

    const options = {
      amount: Math.round(price * 100),
      currency: "INR",
      receipt: `AD_${adId.toString().slice(-6)}`,
      notes: { adId: String(adId), userId: String(req.user.id) }
    };
    const order = await razorpay.orders.create(options);
    res.json(order);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

router.post('/verify-ad', auth, validate(schemas.verifyAd), async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, adId } = req.body;
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET).update(body.toString()).digest("hex");
    if (expectedSignature !== razorpay_signature) return res.status(400).json({ msg: 'Invalid signature.' });

    const ad = await AdPlacement.findById(adId);
    if (!ad) return res.status(404).json({ msg: 'Ad not found' });

    if (ad.mediaUrl || ad.videoUrl) {
      ad.status = 'active';
    } else {
      ad.status = 'paid';
    }
    ad.isBooked = true;
    await ad.save();

    res.json({ success: true, ad });
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

module.exports = router;