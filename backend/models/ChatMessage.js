const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Assuming a User model exists
    required: true,
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Assuming a User model exists, or an Admin model
    required: true, // For now, assuming direct user-to-user or user-to-admin chat
  },
  message: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  read: {
    type: Boolean,
    default: false,
  },
  appType: {
    type: String,
    enum: ['customer-app', 'barber-app', 'main-website'], // To identify source of message
    required: true,
  },
});

const ChatMessage = mongoose.model('ChatMessage', chatMessageSchema);

// Add indexes for performance (including partial indexes for efficiency)
chatMessageSchema.index({ sender: 1, receiver: 1, timestamp: -1 });
chatMessageSchema.index({ receiver: 1, timestamp: -1 }, {
  partialFilterExpression: { read: false } // Only index unread messages for receiver
});
chatMessageSchema.index({ sender: 1, timestamp: -1 });
chatMessageSchema.index({ timestamp: -1 }, {
  partialFilterExpression: {
    timestamp: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Only last 30 days
  }
});

module.exports = ChatMessage;
