const mongoose = require('mongoose');
// 1. Import encryption directly
const { encrypt, decrypt } = require('../utils/EncryptionService');
// 2. Import audit middleware
const AuditLogger = require('../middleware/auditMiddleware');

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  
  // =========================================================
  // FIXED FIELDS: Type Object + Explicit Encrypt/Decrypt
  // =========================================================
  title: {
    type: Object,       // Changed to Object
    required: true,
    set: encrypt,       // Encrypt on save
    get: decrypt,       // Decrypt on fetch
  },
  message: {
    type: Object,       // Changed to Object
    required: true,
    set: encrypt,
    get: decrypt,
  },
  // =========================================================
  relatedId: {
    type: String,
    required: false,
  },
  type: {
    type: String,
    required: false,
    default: 'system',
  },

  date: {
    type: Date,
    default: Date.now,
  },
  read: {
    type: Boolean,
    default: false,
  },
}, {
  // 2. CRITICAL: Ensure decrypted values are sent to frontend
  toJSON: { getters: true },
  toObject: { getters: true }
});

// Remove the plugin
// notificationSchema.plugin(encryptedSchemaPlugin);

// Add indexes for performance
notificationSchema.index({ userId: 1, date: -1 });
notificationSchema.index({ userId: 1, read: 1 }, {
  partialFilterExpression: { read: false }
});
// Add virtual for audit context
notificationSchema.virtual('_auditUserId').get(function() {
  return this.userId; // Use the user who receives the notification
});

// Apply audit plugin
notificationSchema.plugin(AuditLogger.mongoosePlugin);

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;
