const mongoose = require('mongoose');
// 1. Import encryption directly
const { encrypt, decrypt } = require('../utils/EncryptionService');
// 2. Import audit middleware
const AuditLogger = require('../middleware/auditMiddleware');

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
  
  // =========================================================
  // FIXED FIELDS: Type Object + Explicit Encrypt/Decrypt
  // =========================================================
  comment: {
    type: Object,       // Changed to Object
    set: encrypt,       // Encrypt on save
    get: decrypt,       // Decrypt on fetch
  },
  title: {
    type: Object,       // Changed to Object
    set: encrypt,
    get: decrypt,
  },
  barberResponse: {
    type: Object,       // Changed to Object
    set: encrypt,
    get: decrypt,
  },
  // =========================================================

  createdAt: {
    type: Date,
    default: Date.now,
  },
}, {
  // 2. CRITICAL: Ensure decrypted values are sent to frontend
  toJSON: { getters: true },
  toObject: { getters: true }
});

// Remove the plugin
// reviewSchema.plugin(encryptedSchemaPlugin);

// Add indexes for performance
reviewSchema.index({ barberId: 1, createdAt: -1 });
reviewSchema.index({ userId: 1, barberId: 1 });
reviewSchema.index({ bookingId: 1 }, { unique: true });
// Add virtual for audit context
reviewSchema.virtual('_auditUserId').get(function() {
  return this.userId; // Use the user who wrote the review
});

// Apply audit plugin
reviewSchema.plugin(AuditLogger.mongoosePlugin);

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
