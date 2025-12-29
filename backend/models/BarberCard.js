const mongoose = require('mongoose');

const barberCardSchema = new mongoose.Schema({
  barberId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  shopId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shop',
    // required: true, // Temporarily not required for testing
  },
  name: {
    type: String,
    required: true,
  },
  services: [{
    serviceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Service',
      required: true,
    },
    id: String,
    name: String,
    price: String,
    time: String,
  }],
  specialties: [String],
  avgAppointmentTime: {
    type: String,
    default: '30 min',
  },
  isAvailable: {
    type: Boolean,
    default: true,
  },
  image: String,
  rating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0,
  },
  reviews: {
    type: Number,
    default: 0,
  },
  clickCount: {
    type: Number,
    default: 0,
  },
  todaysBookings: {
    type: Number,
    default: 0,
  },
  approvalStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },
  approvalDate: {
    type: Date,
  },
  rejectionReason: {
    type: String,
  },
  pendingChanges: {
    type: mongoose.Schema.Types.Mixed, // Store pending updates
  },
  originalData: {
    type: mongoose.Schema.Types.Mixed, // Store original approved data
  },
  changeDetails: [{
    field: String,
    oldValue: mongoose.Schema.Types.Mixed,
    newValue: mongoose.Schema.Types.Mixed,
    description: String,
  }],
}, {
  timestamps: true,
});

const BarberCard = mongoose.model('BarberCard', barberCardSchema);

module.exports = BarberCard;
