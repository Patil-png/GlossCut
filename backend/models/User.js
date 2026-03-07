const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { encrypt, decrypt, createHMAC } = require('../utils/EncryptionService');
const AuditLogger = require('../middleware/auditMiddleware');

const userSchema = new mongoose.Schema({
  // =========================================================
  // CORE IDENTITY (Encrypted + Hashed)
  // =========================================================
  name: {
    type: Object,      // Stored as { iv, content }
    required: true,
    set: encrypt,      // Auto-encrypt on assignment
    get: decrypt,      // Auto-decrypt on retrieval
  },
  email: {
    type: Object,
    required: true,
    set: encrypt,
    get: decrypt,
  },
  // Secure Hash for fast lookups (matches your Passport logic)
  emailHash: {
    type: String,
    unique: true,
    index: true,
  },
  phone: {
    type: Object,
    set: encrypt,
    get: decrypt,
  },
  phoneHash: {
    type: String,
    unique: true,
    sparse: true,
    index: true,
  },
  password: {
    type: String, // Bcrypt hash
  },

  // =========================================================
  // HYBRID AUTH & GOOGLE FIELDS
  // =========================================================
  googleId: {
    type: String,
    index: true,
    sparse: true
  },
  profilePicture: {
    type: String
  },
  role: {
    type: String,
    enum: ['barber', 'customer', 'admin'],
    default: 'customer',
  },

  // Personal Info
  gender: { type: String },
  language: { type: String },

  // Security & Verification
  isEmailVerified: { type: Boolean, default: false },
  emailVerificationToken: String,
  emailVerificationExpires: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,

  // App Specific
  twoFactorEnabled: { type: Boolean, default: false },
  twoFactorSecret: String,
  twoFactorOtp: String,     // [NEW] Email 2FA
  twoFactorOtpExpires: Date, // [NEW] Email 2FA
  expoPushToken: String,
  notificationsEnabled: { type: Boolean, default: true }, // [NEW] Global notification toggle
  likedBarbers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  likedSalons: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Shop' }],

  // Barber Specific
  isAvailable: { type: Boolean, default: true },
  maxAppointmentsPerDay: { type: Number, default: 10 },
  concurrentServiceCapacity: { type: Number, default: 1 }, // [NEW] Support for parallel appointments
  rating: { type: Number, min: 0, max: 5, default: 0 },
  reviews: { type: Number, default: 0 },

  // Privacy & Permissions (Added for App Check-up)
  privacySettings: {
    notifications: { type: Boolean, default: true },
    locationServices: { type: Boolean, default: true },
    microphone: { type: Boolean, default: false },
  },

  // Activity Tracking
  lastLogin: Date,
  loginCount: { type: Number, default: 0 },

  // Subscription Details
  subscriptionStatus: {
    type: String,
    enum: ['inactive', 'active', 'expired'],
    default: 'inactive',
  },
  subscriptionExpiry: {
    type: Date,
  },
  isTrial: {
    type: Boolean,
    default: false,
  },
  currentSubscription: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BarberSubscription',
  },

}, {
  timestamps: true,
  // CRITICAL: Ensure getters run when sending JSON to frontend
  toJSON: {
    getters: true,
    virtuals: true,
    transform: function (doc, ret) {
      delete ret.password;
      delete ret.emailHash;
      delete ret.phoneHash;
      delete ret.twoFactorSecret;
      delete ret.emailVerificationToken;
      delete ret.passwordResetToken;
      delete ret.__v;
      return ret;
    }
  },
  toObject: { getters: true, virtuals: true }
});

// =========================================================
// VIRTUALS
// =========================================================

// Audit User ID Virtual
// This allows: newUser._auditUserId = newUser._id (from your Passport file)
userSchema.virtual('_auditUserId')
  .get(function () {
    return this.$locals ? this.$locals.auditUserId : null;
  })
  .set(function (value) {
    if (!this.$locals) this.$locals = {};
    this.$locals.auditUserId = value;
  });

// =========================================================
// MIDDLEWARE (HOOKS)
// =========================================================

userSchema.pre('save', async function (next) {
  try {
    // 1. Generate Email Hash (Normalize to lowercase)
    if (this.isModified('email') || this.isNew) {
      const plainEmail = decrypt(this.email);
      this.emailHash = createHMAC(plainEmail.toLowerCase());
    }

    // 2. Generate Phone Hash
    if ((this.isModified('phone') || this.isNew) && this.phone) {
      const plainPhone = decrypt(this.phone);
      this.phoneHash = createHMAC(plainPhone);
    }

    // 3. Hash Password (if present)
    if (this.isModified('password') && this.password) {
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(this.password, salt);
    }

    next();
  } catch (error) {
    next(error);
  }
});

// Helper: Check Password
userSchema.methods.matchPassword = async function (enteredPassword) {
  if (!this.password) return false;
  return await bcrypt.compare(enteredPassword, this.password);
};

// Apply Audit Plugin
userSchema.plugin(AuditLogger.mongoosePlugin);

module.exports = mongoose.model('User', userSchema);