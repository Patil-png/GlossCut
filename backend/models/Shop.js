const mongoose = require('mongoose');
// 1. Import encryption functions directly
const { encrypt, decrypt } = require('../utils/EncryptionService');
// 2. Import audit middleware
const AuditLogger = require('../middleware/auditMiddleware');

const shopSchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  staff: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],

  // =========================================================
  // ENCRYPTED FIELDS (Main Data)
  // =========================================================
  name: {
    type: Object,       // Must be Object to hold { iv, content }
    required: true,
    set: encrypt,       // Encrypt before saving
    get: decrypt,       // Decrypt when fetching
  },
  address: {
    type: Object,
    required: true,
    set: encrypt,
    get: decrypt,
  },
  phone: {
    type: Object,
    required: true,
    set: encrypt,
    get: decrypt,
  },
  tag: {
    type: Object,
    set: encrypt,
    get: decrypt,
  },
  upiId: {
    type: Object,
    set: encrypt,
    get: decrypt,
  },
  // =========================================================

  // =========================================================
  // UNENCRYPTED FIELD (Required for Maps/Distance)
  // =========================================================
  location: {
    type: {
      type: String,
      enum: ['Point'],
    },
    coordinates: {
      type: [Number], // [Longitude, Latitude]
    },
  },
  // =========================================================

  image: { type: String },
  rating: { type: Number, min: 0, max: 5, default: 0 },
  reviews: { type: Number, default: 0 },
  services: [
    {
      id: String,
      name: String,
      price: String,
      time: String,
      barberId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    },
  ],
  category: {
    type: String,
    enum: ["Barber", "Women's Salon", "Pet Care", "Unisex", "Men's Grooming"],
    default: 'Unisex',
  },
  avgAppointmentTime: { type: String, default: '0 min' },
  isAvailable: { type: Boolean, default: false },
  selectedListingPlace: { type: mongoose.Schema.Types.ObjectId, ref: 'ListingPlace' },
  listingConfirmed: { type: Boolean, default: false },
  clickCount: { type: Number, default: 0 },
  operatingHours: {
    monday: { open: String, close: String },
    tuesday: { open: String, close: String },
    wednesday: { open: String, close: String },
    thursday: { open: String, close: String },
    friday: { open: String, close: String },
    saturday: { open: String, close: String },
    sunday: { open: String, close: String },
  },
  approvalStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'approved',
  },
  approvalDate: { type: Date },
  rejectionReason: { type: String },

  // =========================================================
  // SECURE HISTORY & CHANGES (Fixed Data Leak)
  // Explicitly define sensitive fields here to enforce encryption
  // =========================================================
  pendingChanges: {
    name: { type: Object, set: encrypt, get: decrypt },
    address: { type: Object, set: encrypt, get: decrypt },
    phone: { type: Object, set: encrypt, get: decrypt },
    tag: { type: Object, set: encrypt, get: decrypt },
    upiId: { type: Object, set: encrypt, get: decrypt },
    // Non-sensitive fields can remain generic or Mixed
    services: [],
    location: mongoose.Schema.Types.Mixed,
    avgAppointmentTime: String,
    isAvailable: Boolean,
    image: String,
    operatingHours: mongoose.Schema.Types.Mixed
  },
  originalData: {
    name: { type: Object, set: encrypt, get: decrypt },
    address: { type: Object, set: encrypt, get: decrypt },
    phone: { type: Object, set: encrypt, get: decrypt },
    tag: { type: Object, set: encrypt, get: decrypt },
    upiId: { type: Object, set: encrypt, get: decrypt },
    // Non-sensitive fields
    services: [],
    location: mongoose.Schema.Types.Mixed,
    avgAppointmentTime: String,
    isAvailable: Boolean,
    image: String,
    operatingHours: mongoose.Schema.Types.Mixed
  },

  changeDetails: [{
    field: String,
    oldValue: mongoose.Schema.Types.Mixed,
    newValue: mongoose.Schema.Types.Mixed,
    description: String,
  }],
}, {
  timestamps: true,
  // CRITICAL: Forces Mongoose to run 'get: decrypt' when converting to JSON
  toJSON: {
    getters: true,
    transform: function (doc, ret) {
      delete ret.__v;
      return ret;
    }
  },
  toObject: { getters: true }
});

// Indexes
shopSchema.index({ owner: 1 });
shopSchema.index({ category: 1, approvalStatus: 1 }, { partialFilterExpression: { approvalStatus: 'approved' } });
shopSchema.index({ staff: 1 });
shopSchema.index({ approvalStatus: 1 });
shopSchema.index({ rating: -1 }, { partialFilterExpression: { approvalStatus: 'approved' } });
shopSchema.index({ createdAt: -1 });
// Add virtual for audit context
shopSchema.virtual('_auditUserId').get(function () {
  return this.owner; // Use the shop owner as the audit user
});

// Apply audit plugin
shopSchema.plugin(AuditLogger.mongoosePlugin);

const Shop = mongoose.model('Shop', shopSchema);

module.exports = Shop;
