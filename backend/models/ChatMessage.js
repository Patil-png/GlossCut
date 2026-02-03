const mongoose = require('mongoose');
// 1. Import encryption directly
const { encrypt, decrypt } = require('../utils/EncryptionService');

const chatMessageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },

  // =========================================================
  // FIXED FIELDS: Type Object + Explicit Encrypt/Decrypt
  // =========================================================
  message: {
    type: Object,       // Changed to Object to store { iv, content }
    required: true,
    set: encrypt,       // Encrypt on save
    get: decrypt,       // Decrypt on fetch
  },
  // =========================================================

  timestamp: {
    type: Date,
    default: Date.now,
  },
  read: {
    type: Boolean,
    default: false,
  },

  // DO NOT ENCRYPT ENUMS (Keep as String)
  appType: {
    type: String,
    enum: ['customer-app', 'barber-app', 'main-website', 'admin-panel'],
    required: true,
  },
}, {
  // 2. CRITICAL: Ensure decrypted values are sent to frontend
  toJSON: { getters: true },
  toObject: { getters: true }
});

// Remove the plugin
// chatMessageSchema.plugin(encryptedSchemaPlugin);

// Add indexes for performance
chatMessageSchema.index({ sender: 1, receiver: 1, timestamp: -1 });
chatMessageSchema.index({ receiver: 1, timestamp: -1 }, {
  partialFilterExpression: { read: false } // Only index unread messages
});
chatMessageSchema.index({ sender: 1, timestamp: -1 });
chatMessageSchema.index({ timestamp: -1 }, {
  partialFilterExpression: {
    timestamp: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Only last 30 days
  }
});

const ChatMessage = mongoose.model('ChatMessage', chatMessageSchema);

module.exports = ChatMessage;