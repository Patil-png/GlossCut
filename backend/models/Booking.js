const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false, // userId can be optional for offline bookings
  },
  barberId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  isOfflineBooking: {
    type: Boolean,
    default: false,
  },
  customerName: {
    type: String,
    required: function() { return this.isOfflineBooking; }, // Required if it's an offline booking
  },
  customerPhone: {
    type: String,
    required: function() { return this.isOfflineBooking; }, // Required if it's an offline booking
  },
  services: [{
    id: String,
    name: String,
    price: Number,
  }],
  date: {
    type: Date,
    required: true,
  },
  time: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['confirmed', 'completed', 'pending', 'cancelled', 'started'],
    default: 'pending',
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed'],
    default: 'pending',
  },
  totalPrice: {
    type: Number,
    required: true,
  },
  appointmentType: {
    type: String,
    required: false,
  },
  otp: {
    type: String,
    select: false, // OTP should not be returned by default
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  cancellationReason: {
    type: String,
  },
  paymentIntentId: {
    type: String,
    required: false,
  },
  tempDelayMinutes: {
    type: Number,
    default: 0,
  },
});

// Add indexes for performance (including partial indexes for efficiency)
bookingSchema.index({ barberId: 1, date: 1, time: 1 });
bookingSchema.index({ barberId: 1, date: 1, status: 1 }, {
  partialFilterExpression: { status: { $ne: 'cancelled' } } // Exclude cancelled bookings
});
bookingSchema.index({ barberId: 1, date: 1, paymentStatus: 1 }, {
  partialFilterExpression: { paymentStatus: 'pending' } // Only index pending payments
});
bookingSchema.index({ barberId: 1, date: 1, appointmentType: 1 }, {
  partialFilterExpression: { status: { $in: ['confirmed', 'pending', 'started'] } } // Only active bookings
});
bookingSchema.index({ userId: 1, status: 1 }, {
  partialFilterExpression: { status: { $ne: 'cancelled' } } // Exclude cancelled bookings
});
bookingSchema.index({ status: 1 }, {
  partialFilterExpression: { status: { $in: ['confirmed', 'pending', 'started'] } } // Only active statuses
});
bookingSchema.index({ paymentStatus: 1 }, {
  partialFilterExpression: { paymentStatus: 'pending' } // Only pending payments
});
bookingSchema.index({ createdAt: -1 });

const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking;
