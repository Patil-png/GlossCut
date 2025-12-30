const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
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
  phone: {
    type: String,
    unique: true,
  },
  role: {
    type: String,
    enum: ['barber', 'customer'],
    default: 'customer',
  },
  resetPasswordOtp: {
    type: String,
  },
  resetPasswordExpires: {
    type: Date,
  },
  profilePicture: {
    type: String,
  },
  gender: {
    type: String,
  },
  language: {
    type: String,
  },
  expoPushToken: {
    type: String,
  },
  notificationsEnabled: {
    type: Boolean,
    default: true,
  },
  twoFactorEnabled: {
    type: Boolean,
    default: false,
  },
  twoFactorSecret: {
    type: String,
  },
  trustedContacts: [
    {
      name: String,
      phone: String,
    },
  ],
  maxAppointmentsPerDay: {
    type: Number,
    default: 10,
  },
  likedProviders: [{
    providerId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    providerType: {
      type: String,
      enum: ['barber', 'shop'],
      required: true
    },
    likedAt: {
      type: Date,
      default: Date.now
    }
  }],
  setkarCoins: {
    type: Number,
    default: 0,
  },
  completedBookings: {
    type: Number,
    default: 0,
  },
  loyaltyRewardsEarned: {
    type: Number,
    default: 0,
  },
  lastLoyaltyRewardDate: {
    type: Date,
  },
  rating: {
    type: Number,
    default: 0,
  },
  reviews: {
    type: Number,
    default: 0,
  },
  todaysBookings: {
    type: Number,
    default: 0,
  },
  isAvailable: {
    type: Boolean,
    default: true,
  },
});

// Add indexes for performance (including partial indexes for efficiency)
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ role: 1 });
userSchema.index({ maxAppointmentsPerDay: 1 }, {
  partialFilterExpression: { role: 'barber' } // Only index barbers
});
userSchema.index({ todaysBookings: 1 }, {
  partialFilterExpression: { role: 'barber', isAvailable: true } // Only available barbers
});
userSchema.index({ isAvailable: 1 }, {
  partialFilterExpression: { role: 'barber' } // Only barbers
});
userSchema.index({ setkarCoins: 1 });
userSchema.index({ completedBookings: 1 });
userSchema.index({ rating: 1 }, {
  partialFilterExpression: { role: 'barber' } // Only barbers
});
userSchema.index({ reviews: 1 }, {
  partialFilterExpression: { role: 'barber' } // Only barbers
});

const User = mongoose.model('User', userSchema);

module.exports = User;
