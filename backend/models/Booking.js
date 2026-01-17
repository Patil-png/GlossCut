const mongoose = require('mongoose');
// 1. Import encryption directly
const { encrypt, decrypt } = require('../utils/EncryptionService');
// 2. Import audit middleware
const AuditLogger = require('../middleware/auditMiddleware');

const bookingSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false,
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
  
  // =========================================================
  // FIXED FIELDS: Type Object + Explicit Encrypt/Decrypt
  // =========================================================
  customerName: {
    type: Object, // Changed to Object
    required: function() { return this.isOfflineBooking; },
    set: encrypt,
    get: decrypt,
  },
  customerPhone: {
    type: Object, // Changed to Object
    required: function() { return this.isOfflineBooking; },
    set: encrypt,
    get: decrypt,
  },
  cancellationReason: {
    type: Object, // Changed to Object
    set: encrypt,
    get: decrypt,
  },
  otp: {
    type: Object, // Changed to Object (OTP is sensitive!)
    select: false,
    set: encrypt,
    get: decrypt,
  },
  // =========================================================

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
    type: String, // "14:00" - Safe to keep as String
    required: true,
  },
  
  // ENUMS MUST REMAIN STRINGS
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
  skipCount: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  paymentIntentId: {
    type: String,
    required: false,
  },
  tempDelayMinutes: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
  // 2. CRITICAL: Ensure decrypted values are sent to frontend
  toJSON: { getters: true },
  toObject: { getters: true }
});

// Remove the plugin
// bookingSchema.plugin(encryptedSchemaPlugin);

// Add indexes for performance
bookingSchema.index({ barberId: 1, date: 1, time: 1 });
bookingSchema.index({ barberId: 1, date: 1, status: 1 }, {
  partialFilterExpression: { status: { $ne: 'cancelled' } }
});
bookingSchema.index({ barberId: 1, date: 1, paymentStatus: 1 }, {
  partialFilterExpression: { paymentStatus: 'pending' }
});
bookingSchema.index({ barberId: 1, date: 1, appointmentType: 1 }, {
  partialFilterExpression: { status: { $in: ['confirmed', 'pending', 'started'] } }
});
bookingSchema.index({ userId: 1, status: 1 }, {
  partialFilterExpression: { status: { $ne: 'cancelled' } }
});
bookingSchema.index({ status: 1 }, {
  partialFilterExpression: { status: { $in: ['confirmed', 'pending', 'started'] } }
});
bookingSchema.index({ paymentStatus: 1 }, {
  partialFilterExpression: { paymentStatus: 'pending' }
});
// Add virtual for audit context
bookingSchema.virtual('_auditUserId').get(function() {
  return this.userId; // Use the customer who made the booking
});

// Apply audit plugin
bookingSchema.plugin(AuditLogger.mongoosePlugin);

const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking;
