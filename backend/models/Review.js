const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true,
  },
  barberId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  comment: {
    type: String,
  },
  title: {
    type: String,
  },
  barberResponse: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Review = mongoose.model('Review', reviewSchema);

// Add indexes for performance
reviewSchema.index({ barberId: 1, createdAt: -1 });
reviewSchema.index({ userId: 1, barberId: 1 });
reviewSchema.index({ bookingId: 1 }, { unique: true });
reviewSchema.index({ rating: -1 });

module.exports = Review;
