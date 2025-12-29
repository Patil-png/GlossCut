const mongoose = require('mongoose');

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
  reason: {
    type: String,
    default: '',
  },
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
  rejectionReason: {
    type: String,
  },
}, {
  timestamps: true,
});

const BarberCardDeleteRequest = mongoose.model('BarberCardDeleteRequest', barberCardDeleteRequestSchema);

module.exports = BarberCardDeleteRequest;
