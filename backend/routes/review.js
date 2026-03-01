const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Review = require('../models/Review');
const User = require('../models/User'); // Import User model
const Shop = require('../models/Shop');
const Booking = require('../models/Booking');
const Notification = require('../models/Notification'); // Import Notification model
const validate = require('../middleware/validate');
const schemas = require('../utils/validationSchemas');

// Ultra-efficient in-memory cache for review operations
const reviewCache = new Map();
const REVIEW_CACHE_DURATION = 2 * 60 * 1000; // 2 minutes for review data

// Cache management functions
const getReviewCached = (key) => {
  const cached = reviewCache.get(key);
  if (cached && Date.now() - cached.timestamp < REVIEW_CACHE_DURATION) {
    return cached.data;
  }
  reviewCache.delete(key);
  return null;
};

const setReviewCached = (key, data) => {
  reviewCache.set(key, { data, timestamp: Date.now() });
  // Prevent memory leaks - limit cache size
  if (reviewCache.size > 200) {
    const firstKey = reviewCache.keys().next().value;
    reviewCache.delete(firstKey);
  }
};

// @route   POST api/review
// @desc    Submit a review for a booking
// @access  Private
router.post('/', auth, validate(schemas.createReview), async (req, res) => {
  const { bookingId, rating, comment, title } = req.body; // Add title to destructuring

  try {
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ msg: 'Booking not found' });
    }

    // Check if the user has already reviewed this booking
    let review = await Review.findOne({ bookingId, userId: req.user.id });
    if (review) {
      return res.status(400).json({ msg: 'You have already reviewed this booking' });
    }

    // Creating review triggers 'set: encrypt' on comment/title automatically
    review = new Review({
      bookingId,
      barberId: booking.barberId,
      userId: req.user.id,
      rating,
      comment,
      title,
    });

    await review.save();

    // Increment barber's reviews count and update rating
    const barber = await User.findById(booking.barberId);
    if (barber) {
      const allBarberReviews = await Review.find({ barberId: booking.barberId });
      const totalRating = allBarberReviews.reduce((acc, item) => acc + item.rating, 0);
      barber.reviews = allBarberReviews.length;
      barber.rating = totalRating / allBarberReviews.length;
      await barber.save();
    }

    // Update shop rating
    const shop = await Shop.findOne({ owner: booking.barberId });
    if (shop) {
      const reviews = await Review.find({ barberId: booking.barberId });
      const totalRating = reviews.reduce((acc, item) => acc + item.rating, 0);
      shop.rating = totalRating / reviews.length;
      shop.reviews = reviews.length;
      await shop.save();
    }

    res.json(review);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/review/:bookingId
// @desc    Get review for a booking
// @access  Private
router.get('/:bookingId', auth, async (req, res) => {
  try {
    // Mongoose automatically decrypts on find
    const review = await Review.findOne({ bookingId: req.params.bookingId, userId: req.user.id });
    res.json(review);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/reviews/customer/:customerId/barber/:barberId
// @desc    Get all reviews given by a specific customer to a specific barber
// @access  Private (assuming only the barber can view this)
router.get('/customer/:customerId/barber/:barberId', auth, async (req, res) => {
  console.log(`Backend: /api/reviews/customer/${req.params.customerId}/barber/${req.params.barberId} hit.`);
  try {
    const { customerId, barberId } = req.params;
    console.log(`Backend: customerId: ${customerId}, barberId: ${barberId}, req.user.id: ${req.user.id}`);

    // Ensure the authenticated user is the barber whose reviews are being requested
    if (req.user.id !== barberId) {
      console.log('Backend: User not authorized for this barberId.');
      return res.status(401).json({ msg: 'User not authorized' });
    }

    const reviews = await Review.find({
      userId: customerId,
      barberId: barberId,
    }).populate('userId', 'name profilePicture').sort({ createdAt: -1 });

    console.log('Backend: Reviews found:', reviews.length);
    res.json(reviews);
  } catch (err) {
    console.error('Backend Error fetching customer reviews:', err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/reviews/barber/:barberId
// @desc    Get all reviews for a barber (ultra-optimized with caching)
router.get('/barber/:barberId', async (req, res) => {
  try {
    const cacheKey = `reviews_barber_${req.params.barberId}`;
    const cached = getReviewCached(cacheKey);

    if (cached) {
      return res.json(cached);
    }

    // FIXED: Removed .lean() so decryption works for both Review content and Populated User Name
    const reviews = await Review.find({ barberId: req.params.barberId })
      .populate('userId', 'name profilePicture')
      .sort({ createdAt: -1 });

    setReviewCached(cacheKey, reviews);
    res.json(reviews);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/review/:reviewId/respond
// @desc    Barber responds to a customer review
// @access  Private (Barber only)
router.put('/:reviewId/respond', auth, validate(schemas.respondReview), async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { barberResponse } = req.body;

    const review = await Review.findById(reviewId);

    if (!review) {
      return res.status(404).json({ msg: 'Review not found' });
    }

    // Ensure the authenticated user is the barber who owns the review
    if (review.barberId.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'User not authorized to respond to this review' });
    }

    review.barberResponse = barberResponse; // Setter encrypts this automatically
    await review.save();

    // Create a notification for the customer
    const barber = await User.findById(req.user.id);
    if (barber) {
      // barber.name is decrypted by getter automatically
      const notification = new Notification({
        userId: review.userId,
        title: `Barber ${barber.name} responded to your review!`,
        message: `"${barberResponse}"`,
      });
      await notification.save(); // Notification setter encrypts title/message
    }

    res.json(review);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;