const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
// 1. Import encryption directly
const { encrypt, decrypt, createHMAC } = require('../utils/EncryptionService');
// 2. Import audit middleware
const AuditLogger = require('../middleware/auditMiddleware');

const adminSchema = new mongoose.Schema({
  // =========================================================
  // ENCRYPTED FIELDS: Type Object + Explicit Encrypt/Decrypt
  // =========================================================
  name: {
    type: Object,
    required: true,
    set: encrypt,
    get: decrypt,
  },
  email: {
    type: Object,
    required: true,
    set: encrypt,
    get: decrypt,
  },
  // 3. NEW: Add Email Hash for Login & Uniqueness
  // (Required because encrypted 'email' changes every time)
  emailHash: {
    type: String,
    unique: true,
    index: true,
  },
  // =========================================================

  password: {
    type: String,
    required: true,
  },

  role: {
    type: String,
    enum: ['superadmin', 'admin'],
    default: 'admin',
  },
  permissions: {
    type: [String],
    default: [],
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  lastLogin: {
    type: Date,
  },
  isTwoFactorEnabled: {
    type: Boolean,
    default: false,
  },
  twoFactorSecret: {
    type: Object, // Encrypted
    set: encrypt,
    get: decrypt,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  // 5-LEVEL SAFETY SYSTEM FIELDS
  approvedDevices: [{
    deviceId: String,
    deviceModel: String,
    os: String,
    addedAt: { type: Date, default: Date.now },
    lastLogin: { type: Date, default: Date.now }
  }],
  isEmergencyLocked: {
    type: Boolean,
    default: false
  },
}, {
  // Ensure decrypted values are sent to frontend
  toJSON: {
    getters: true,
    transform: function (doc, ret) {
      delete ret.password;
      delete ret.emailHash;
      delete ret.__v;
      return ret;
    }
  },
  toObject: { getters: true }
});

// Hash password AND create emailHash before saving
adminSchema.pre('save', async function (next) {
  try {
    // 1. Generate Email Hash (Critical for Login)
    if (this.isModified('email') || this.isNew) {
      // Decrypt the object to get the plain string, then hash it
      const plainEmail = decrypt(this.email);
      this.emailHash = createHMAC(plainEmail);
    }

    // 2. Hash Password
    if (this.isModified('password')) {
      this.password = await bcrypt.hash(this.password, 12);
    }
    next();
  } catch (error) {
    next(error);
  }
});

// Add virtual for audit context
adminSchema.virtual('_auditUserId').get(function () {
  return this._id; // Use the admin's own ID
});

// Apply audit plugin
adminSchema.plugin(AuditLogger.mongoosePlugin);

adminSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

const Admin = mongoose.model('Admin', adminSchema);

module.exports = Admin;
