const mongoose = require('mongoose');

const setkarCoinTransactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  type: {
    type: String,
    enum: ['recharge', 'redeem'],
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
});

const SetkarCoinTransaction = mongoose.model('SetkarCoinTransaction', setkarCoinTransactionSchema);

// Add indexes for performance (including partial indexes for efficiency)
setkarCoinTransactionSchema.index({ userId: 1, date: -1 });
setkarCoinTransactionSchema.index({ userId: 1, type: 1 });
setkarCoinTransactionSchema.index({ date: -1 }, {
  partialFilterExpression: {
    date: { $gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) } // Only last 90 days
  }
});

module.exports = SetkarCoinTransaction;
