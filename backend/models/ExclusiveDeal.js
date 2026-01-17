const mongoose = require('mongoose');
// 2. Import audit middleware
const AuditLogger = require('../middleware/auditMiddleware');
// 1. Import encryption directly
const { encrypt, decrypt } = require('../utils/EncryptionService');

const exclusiveDealSchema = new mongoose.Schema({
  // =========================================================
  // FIXED FIELDS: Type Object + Explicit Encrypt/Decrypt
  // =========================================================
  title: {
    type: Object,       // Changed to Object
    required: true,
    set: encrypt,       // Encrypt on save
    get: decrypt,       // Decrypt on fetch
  },
  description: {
    type: Object,       // Changed to Object
    required: true,
    set: encrypt,
    get: decrypt,
  },
  image: {
    type: Object,       // Changed to Object (URLs should be encrypted too)
    set: encrypt,
    get: decrypt,
  },
  // =========================================================

  discountPercentage: {
    type: Number,
    default: 0,
  },
  bonusCoins: {
    type: Number,
    default: 0,
  },
  minimumPurchase: {
    type: Number,
    default: 0,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  validUntil: {
    type: Date,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
}, {
  // 2. CRITICAL: Ensure decrypted values are sent to frontend
  toJSON: { getters: true },
  toObject: { getters: true }
});

// Add virtual for audit context
exclusiveDealSchema.virtual('_auditUserId').get(function() {
  return null; // Deals are typically managed by admins/system
});

// Apply audit plugin
exclusiveDealSchema.plugin(AuditLogger.mongoosePlugin);

const ExclusiveDeal = mongoose.model('ExclusiveDeal', exclusiveDealSchema);

module.exports = ExclusiveDeal;
