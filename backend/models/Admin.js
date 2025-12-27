const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
// const encrypt = require('mongoose-encryption');

const adminSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
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
    type: [String], // e.g., ['manage_users', 'manage_bookings', etc.]
    default: [],
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  lastLogin: {
    type: Date,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// // Encrypt sensitive fields
// const encKey = process.env.ENC_KEY || 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopq'; // 32 byte base64 key (43 chars)
// const sigKey = process.env.SIG_KEY || 'signatureKey123456789012345678901234567890';

// adminSchema.plugin(encrypt, {
//   encryptionKey: encKey,
//   signingKey: sigKey,
//   encryptedFields: ['email', 'name'], // Encrypt email and name
// });

// Hash password before saving
adminSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Method to check password
adminSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

const Admin = mongoose.model('Admin', adminSchema);

module.exports = Admin;
