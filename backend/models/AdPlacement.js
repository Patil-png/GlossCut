const mongoose = require('mongoose');
// 1. Import encryption directly
const { encrypt, decrypt } = require('../utils/EncryptionService');
// 2. Import audit middleware
const AuditLogger = require('../middleware/auditMiddleware');

const AdPlacementSchema = new mongoose.Schema({
  barberId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  
  // =========================================================
  // FIXED FIELDS: Type Object + Explicit Encrypt/Decrypt
  // =========================================================
  videoUrl: {
    type: Object,      // Changed to Object
    required: false,
    set: encrypt,      // Encrypt on save
    get: decrypt,      // Decrypt on fetch
  },
  mediaUrl: {
    type: Object,      // Changed to Object
    required: false,
    set: encrypt,
    get: decrypt,
  },
  // =========================================================

  // KEEP ENUMS AS STRINGS (Do not encrypt these, or queries will break)
  mediaType: {
    type: String,
    enum: ['youtube', 'image', 'video'], 
    required: false,
  },
  
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
  price: {
    type: Number,
    required: true,
    default: 999,
  },
  
  // KEEP ENUMS AS STRINGS
  status: {
    type: String,
    enum: ['pending', 'active', 'expired', 'booked'],
    default: 'pending',
  },
  
  isBooked: {
    type: Boolean,
    default: false,
  },
  bookedAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true, // Adds createdAt/updatedAt automatically
  // 2. CRITICAL: Ensure decrypted values are sent to frontend
  toJSON: { getters: true },
  toObject: { getters: true }
});

// Add virtual for audit context
AdPlacementSchema.virtual('_auditUserId').get(function() {
  return this.barberId; // Use the barber who placed the ad
});

// Apply audit plugin
AdPlacementSchema.plugin(AuditLogger.mongoosePlugin);

module.exports = mongoose.model('AdPlacement', AdPlacementSchema);
