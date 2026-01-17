const mongoose = require('mongoose');
// 2. Import audit middleware
const AuditLogger = require('../middleware/auditMiddleware');
// 1. Import encryption directly
const { encrypt, decrypt } = require('../utils/EncryptionService');

const setkarCoinTransactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  
  // DO NOT ENCRYPT ENUMS (Keep as String)
  type: {
    type: String,
    enum: ['recharge', 'redeem'],
    required: true,
  },
  
  amount: {
    type: Number,
    required: true,
  },
  
  // =========================================================
  // FIXED FIELD: Type Object + Explicit Encrypt/Decrypt
  // =========================================================
  description: {
    type: Object,       // Changed to Object
    required: true,
    set: encrypt,       // Encrypt on save
    get: decrypt,       // Decrypt on fetch
  },
  // =========================================================

  date: {
    type: Date,
    default: Date.now,
  },
}, {
  // 2. CRITICAL: Ensure decrypted values are sent to frontend
  toJSON: { getters: true },
  toObject: { getters: true }
});

// Remove the plugin
// setkarCoinTransactionSchema.plugin(encryptedSchemaPlugin);

// Add indexes for performance
setkarCoinTransactionSchema.index({ userId: 1, date: -1 });
setkarCoinTransactionSchema.index({ userId: 1, type: 1 });
// Add virtual for audit context
setkarCoinTransactionSchema.virtual('_auditUserId').get(function() {
  return this.userId; // Use the user who made the transaction
});

// Apply audit plugin
setkarCoinTransactionSchema.plugin(AuditLogger.mongoosePlugin);

const SetkarCoinTransaction = mongoose.model('SetkarCoinTransaction', setkarCoinTransactionSchema);

module.exports = SetkarCoinTransaction;
