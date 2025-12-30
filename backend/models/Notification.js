const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  read: {
    type: Boolean,
    default: false,
  },
});

const Notification = mongoose.model('Notification', notificationSchema);

// Add indexes for performance (including partial indexes for efficiency)
notificationSchema.index({ userId: 1, date: -1 });
notificationSchema.index({ userId: 1, read: 1 }, {
  partialFilterExpression: { read: false } // Only index unread notifications
});
notificationSchema.index({ date: -1 });

module.exports = Notification;
