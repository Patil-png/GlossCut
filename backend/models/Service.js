const mongoose = require('mongoose');
// 1. Import encryption directly
const { encrypt, decrypt } = require('../utils/EncryptionService');
// 2. Import audit middleware
const AuditLogger = require('../middleware/auditMiddleware');

const serviceSchema = new mongoose.Schema({
  // =========================================================
  // FIXED FIELDS: Type Object + Explicit Encrypt/Decrypt
  // =========================================================
  name: {
    type: Object,       // Changed to Object
    required: true,
    // unique: true,    // Note: With encryption, unique checks on the DB level are less effective
    set: encrypt,       // Encrypt on save
    get: decrypt,       // Decrypt on fetch
  },
  description: {
    type: Object,       // Changed to Object
    required: true,
    set: encrypt,
    get: decrypt,
  },
  category: {
    type: Object,       // Changed to Object
    default: 'General',
    set: encrypt,
    get: decrypt,
  },
  shopId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shop',
    default: null, // null means it's a "Master Service"
  },
  // =========================================================

  isActive: {
    type: Boolean,
    default: true,
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
serviceSchema.virtual('_auditUserId').get(function () {
  return null; // Services are typically managed by admins/system
});

// Apply audit plugin
serviceSchema.plugin(AuditLogger.mongoosePlugin);

const Service = mongoose.model('Service', serviceSchema);

module.exports = Service;
