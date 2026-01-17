const mongoose = require('mongoose');
// 2. Import audit middleware
const AuditLogger = require('../middleware/auditMiddleware');
// 1. Import encryption directly
const { encrypt, decrypt } = require('../utils/EncryptionService');

const barberCardDeleteRequestSchema = new mongoose.Schema({
  barberCardId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BarberCard',
    required: true,
  },
  barberId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  shopId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shop',
  },
  
  // =========================================================
  // FIXED FIELDS: Type Object + Explicit Encrypt/Decrypt
  // =========================================================
  reason: {
    type: Object,      // Changed to Object
    default: '',
    set: encrypt,      // Encrypt on save
    get: decrypt,      // Decrypt on fetch
  },
  rejectionReason: {
    type: Object,      // Changed to Object
    set: encrypt,
    get: decrypt,
  },
  // =========================================================

  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },
  requestedAt: {
    type: Date,
    default: Date.now,
  },
  processedAt: {
    type: Date,
  },
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
  },
}, {
  timestamps: true,
  // 2. CRITICAL: Ensure decrypted values are sent to frontend
  toJSON: { getters: true },
  toObject: { getters: true }
});

// Add virtual for audit context
barberCardDeleteRequestSchema.virtual('_auditUserId').get(function() {
  return this.barberId; // Use the barber who requested the deletion
});

// Apply audit plugin
barberCardDeleteRequestSchema.plugin(AuditLogger.mongoosePlugin);

const BarberCardDeleteRequest = mongoose.model('BarberCardDeleteRequest', barberCardDeleteRequestSchema);

module.exports = BarberCardDeleteRequest;
