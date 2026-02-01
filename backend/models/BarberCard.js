const mongoose = require('mongoose');
// 1. Import encryption directly
const { encrypt, decrypt } = require('../utils/EncryptionService');
// 2. Import audit middleware
const AuditLogger = require('../middleware/auditMiddleware');

const barberCardSchema = new mongoose.Schema({
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
  name: {
    type: Object,       // Changed to Object
    required: true,
    set: encrypt,       // Encrypt on save
    get: decrypt,       // Decrypt on fetch
  },
  avgAppointmentTime: {
    type: Object,       // Encrypt this too if it was encrypted before
    default: '30 min',
    set: encrypt,
    get: decrypt,
  },
  // =========================================================

  services: [{
    serviceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Service',
      required: true,
    },
    id: String,
    name: String, // Service names (e.g. "Haircut") usually don't need encryption
    price: String,
    time: String,
  }],
  specialties: [String],

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
    enum: ['pending', 'pending_owner_approval', 'pending_admin_approval', 'approved', 'rejected'],
    default: 'pending',
  },
  approvalDate: {
    type: Date,
  },
  rejectionReason: {
    type: String,
  },
  pendingChanges: {
    type: mongoose.Schema.Types.Mixed,
  },
  originalData: {
    type: mongoose.Schema.Types.Mixed,
  },
  changeDetails: [{
    field: String,
    oldValue: mongoose.Schema.Types.Mixed,
    newValue: mongoose.Schema.Types.Mixed,
    description: String,
  }],
}, {
  timestamps: true,
  // 2. CRITICAL: Ensure decrypted values are sent to frontend
  // 2. CRITICAL: Ensure decrypted values are sent to frontend
  toJSON: {
    getters: true,
    transform: function (doc, ret) {
      delete ret.__v;
      return ret;
    }
  },
  toObject: { getters: true }
});

// Add virtual for audit context
barberCardSchema.virtual('_auditUserId').get(function () {
  return this.barberId; // Use the barber who owns this card
});

// Apply audit plugin
barberCardSchema.plugin(AuditLogger.mongoosePlugin);

const BarberCard = mongoose.model('BarberCard', barberCardSchema);

module.exports = BarberCard;
