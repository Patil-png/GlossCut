const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Shop = require('../models/Shop');
const auth = require('../middleware/auth');
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');
const nodemailer = require('nodemailer');
const multer = require('multer');
const path = require('path');

// Ultra-efficient in-memory cache for auth operations
const authCache = new Map();
const AUTH_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes for auth data

// Cache management functions
const getAuthCached = (key) => {
  const cached = authCache.get(key);
  if (cached && Date.now() - cached.timestamp < AUTH_CACHE_DURATION) {
    return cached.data;
  }
  authCache.delete(key);
  return null;
};

const setAuthCached = (key, data) => {
  authCache.set(key, { data, timestamp: Date.now() });
  // Prevent memory leaks - limit cache size
  if (authCache.size > 200) {
    const firstKey = authCache.keys().next().value;
    authCache.delete(firstKey);
  }
};

// Multer storage configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });

// @route   POST api/auth/upload-picture
// @desc    Upload a profile picture
// @access  Private
router.post('/upload-picture', auth, upload.single('profilePicture'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ msg: 'No file uploaded' });
    }
    const imageUrl = `/uploads/${req.file.filename}`;
    res.json({ imageUrl });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/auth/2fa/send-otp
// @desc    Send OTP for two-factor authentication
// @access  Private
router.post('/2fa/send-otp', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const secret = user.twoFactorSecret;
    const token = speakeasy.totp({
      secret: secret,
      encoding: 'base32',
    });

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL,
        pass: process.env.PASSWORD,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL,
      to: user.email,
      subject: 'Your Two-Factor Authentication Code',
      text: `Your two-factor authentication code is: ${token}`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        return res.status(500).send('Server Error');
      }
      res.json({ msg: 'OTP sent' });
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/auth/2fa/setup
// @desc    Setup two-factor authentication
// @access  Private
router.post('/2fa/setup', auth, async (req, res) => {
  try {
    const secret = speakeasy.generateSecret({
      name: `SetKarr (${req.user.email})`,
    });
    await User.findByIdAndUpdate(req.user.id, { twoFactorSecret: secret.base32 });
    qrcode.toDataURL(secret.otpauth_url, (err, data_url) => {
      if (err) {
        throw err;
      }
      res.json({ qrCode: data_url, secret: secret.base32 });
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/auth/2fa/verify
// @desc    Verify two-factor authentication
// @access  Private
router.post('/2fa/verify', auth, async (req, res) => {
  const { token } = req.body;
  try {
    const user = await User.findById(req.user.id);
    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token,
    });
    if (verified) {
      await User.findByIdAndUpdate(req.user.id, { twoFactorEnabled: true });
      res.json({ msg: 'Two-factor authentication enabled' });
    } else {
      res.status(400).json({ msg: 'Invalid token' });
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/auth/user
// @desc    Get user data
// @access  Private
router.get('/user', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (user && user.role === 'barber') {
      const shop = await Shop.findOne({ owner: user._id }).select('category');
      if (shop) {
        return res.json({ ...user.toObject(), shopCategory: shop.category });
      }
    }
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/auth/user/:id
// @desc    Get user data by ID (for public access, e.g., by customer app)
// @access  Private (auth middleware ensures user is logged in, but allows fetching other user's public data)
router.get('/user/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    if (user.role === 'barber') {
      const shop = await Shop.findOne({ owner: user._id }).select('category');
      if (shop) {
        return res.json({ ...user.toObject(), shopCategory: shop.category });
      }
    }
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/auth/user
// @desc    Update user profile
// @access  Private
router.put('/user', auth, async (req, res) => {
  const { name, email, phone, gender, language, profilePicture, notificationsEnabled, shopName, shopAddress, shopPhone, shopImage, maxAppointmentsPerDay, isAvailable } = req.body;
  const userId = req.user.id;

  try {
    let user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    if (name) user.name = name;
    if (email) user.email = email.toLowerCase(); // Ensure email is stored in lowercase
    if (phone) user.phone = phone;
    if (gender) user.gender = gender;
    if (language) user.language = language;
    if (profilePicture) user.profilePicture = profilePicture;
    if (notificationsEnabled !== undefined) user.notificationsEnabled = notificationsEnabled;
    if (maxAppointmentsPerDay) user.maxAppointmentsPerDay = maxAppointmentsPerDay;
    if (isAvailable !== undefined) user.isAvailable = isAvailable;

    await user.save();

    if (user.role === 'barber') {
      let shop = await Shop.findOne({ owner: userId });
      if (shop) {
        if (shopName) shop.name = shopName;
        if (shopAddress) shop.address = shopAddress;
        if (shopPhone) shop.phone = shopPhone;
        if (shopImage) shop.image = shopImage;
        await shop.save();
      }
    }

    res.json(user);
  } catch (err) {
    console.error('Profile update error:', err.message);
    console.error('Error details:', err);
    if (err.code === 11000) {
      // Duplicate key error
      const field = Object.keys(err.keyValue)[0];
      return res.status(409).json({ msg: `${field} is already taken by another user` });
    }
    res.status(500).send('Server Error');
  }
});

// @route   POST api/auth/register
// @desc    Register a user
// @access  Public
router.post('/register', async (req, res) => {
  const { name, email, password, phone, role, shopName, shopAddress, shopPhone, category } = req.body;

  try {
    // Check if email already exists
    let userByEmail = await User.findOne({ email });
    if (userByEmail) {
      return res.status(400).json({ msg: 'Email is already registered', field: 'email' });
    }

    // Check if phone already exists
    let userByPhone = await User.findOne({ phone });
    if (userByPhone) {
      return res.status(400).json({ msg: 'Phone number is already registered', field: 'phone' });
    }

    let user;

    user = new User({
      name,
      email,
      password,
      phone,
      role,
    });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    await user.save();

    if (role === 'barber') {
      console.log('Creating shop and barber card for barber:', user.email);
      console.log('Shop details:', { shopName, shopAddress, shopPhone, category });

      try {
        // Check if a shop with the same details already exists
        const existingShop = await Shop.findOne({
          $or: [
            { address: shopAddress },
            { phone: shopPhone },
            { name: shopName }
          ]
        });

        console.log('Existing shop check result:', existingShop ? 'Found existing shop' : 'No existing shop');

        let shop;
        if (existingShop) {
          // Shop exists - add new barber as staff member
          console.log('Adding barber as staff to existing shop');
          if (!existingShop.staff.includes(user.id)) {
            existingShop.staff.push(user.id);
            await existingShop.save();
            console.log('Barber added as staff successfully');
          } else {
            console.log('Barber already staff at this shop');
          }
          shop = existingShop;
        } else {
          // No existing shop - create new shop with this barber as owner
          console.log('Creating new shop for barber');
          console.log('User ID:', user.id);
          console.log('Shop data:', { owner: user.id, name: shopName, address: shopAddress, phone: shopPhone, category });

          shop = new Shop({
            owner: user.id,
            name: shopName,
            address: shopAddress,
            phone: shopPhone,
            category,
            approvalStatus: 'pending',
          });

          // Validate before saving
          const validationError = shop.validateSync();
          if (validationError) {
            console.error('Shop validation error:', validationError);
            return res.status(400).json({
              msg: 'Shop validation failed',
              error: validationError.message,
              field: Object.keys(validationError.errors)[0]
            });
          }

          await shop.save();
          console.log('New shop created successfully:', shop._id);
        }

        // Create BarberCard for the new barber
        console.log('Creating barber card for user:', user.id);
        const BarberCard = require('../models/BarberCard');

        const barberCard = new BarberCard({
          barberId: user.id,
          shopId: shop._id,
          name: user.name,
          services: [], // Empty initially, barber can add services later
          specialties: [],
          avgAppointmentTime: '30 min',
          isAvailable: true,
          approvalStatus: 'pending', // New barbers start as pending approval
        });

        await barberCard.save();
        console.log('Barber card created successfully:', barberCard._id);

      } catch (shopError) {
        console.error('Shop/BarberCard creation error:', shopError);
        return res.status(500).json({ msg: 'Failed to create shop and barber profile', error: shopError.message });
      }
    }

    const payload = {
      user: {
        id: user.id,
      },
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET || 'secret',
      {
        expiresIn: 360000,
      },
      (err, token) => {
        if (err) throw err;
        res.json({ token });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/auth/login
// @desc    Auth user & get token
// @access  Public
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    console.log('Login attempt for email:', email);

    let user = await User.findOne({ email });

    if (!user) {
      console.log('User not found for email:', email);
      return res.status(400).json({ msg: 'Invalid Credentials' });
    }

    console.log('User found:', user.email, 'Role:', user.role);
    console.log('Stored password hash exists:', !!user.password);

    const isMatch = await bcrypt.compare(password, user.password);

    console.log('Password match result:', isMatch);

    if (!isMatch) {
      console.log('Password does not match for user:', email);
      return res.status(400).json({ msg: 'Invalid Credentials' });
    }

    const payload = {
      user: {
        id: user.id,
      },
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET || 'secret',
      {
        expiresIn: 360000,
      },
      (err, token) => {
        if (err) {
          console.error('JWT signing error:', err);
          throw err;
        }
        console.log('Login successful for user:', email);
        res.json({ token });
      }
    );
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/auth/barber/login
// @desc    Auth barber & get token
// @access  Public
router.post('/barber/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    let user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ msg: 'Invalid Credentials' });
    }

    if (user.role !== 'barber') {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid Credentials' });
    }

    const payload = {
      user: {
        id: user.id,
      },
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET || 'secret',
      {
        expiresIn: 360000,
      },
      (err, token) => {
        if (err) throw err;
        res.json({ token });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/auth/save-push-token
// @desc    Save Expo push token
// @access  Private
router.post('/save-push-token', auth, async (req, res) => {
  const { token } = req.body;
  try {
    await User.findByIdAndUpdate(req.user.id, { expoPushToken: token });
    res.json({ msg: 'Token saved successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/auth/like
// @desc    Like a barber
// @access  Private
router.post('/like', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const { barberId } = req.body;

    if (!user.likedBarbers.includes(barberId)) {
      user.likedBarbers.push(barberId);
      await user.save();
    }

    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/auth/unlike
// @desc    Unlike a barber
// @access  Private
router.post('/unlike', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const { barberId } = req.body;

    user.likedBarbers = user.likedBarbers.filter(id => id.toString() !== barberId);
    await user.save();

    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/auth/liked-barbers
// @desc    Get liked barbers
// @access  Private
router.get('/liked-barbers', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('likedBarbers');
    res.json(user.likedBarbers);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/auth/likeSalon
// @desc    Like a salon
// @access  Private
router.post('/likeSalon', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const { salonId } = req.body;

    if (!user.likedSalons.includes(salonId)) {
      user.likedSalons.push(salonId);
      await user.save();
    }

    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/auth/unlikeSalon
// @desc    Unlike a salon
// @access  Private
router.post('/unlikeSalon', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const { salonId } = req.body;

    user.likedSalons = user.likedSalons.filter(id => id.toString() !== salonId);
    await user.save();

    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/auth/availability
// @desc    Update user availability status
// @access  Private
router.put('/availability', auth, async (req, res) => {
  const { isAvailable } = req.body;

  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    user.isAvailable = isAvailable;
    await user.save();

    res.json({ msg: 'Availability updated', isAvailable: user.isAvailable });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/auth/check-uniqueness
// @desc    Check if email and phone are unique
// @access  Public (for registration)
router.post('/check-uniqueness', async (req, res) => {
  const { email, phone, excludeUserId } = req.body;

  try {
    // Check email uniqueness
    let emailExists = false;
    if (email) {
      const emailUser = await User.findOne({ email: email.toLowerCase() });
      if (emailUser && emailUser._id.toString() !== excludeUserId) {
        emailExists = true;
      }
    }

    // Check phone uniqueness
    let phoneExists = false;
    if (phone) {
      const phoneUser = await User.findOne({ phone });
      if (phoneUser && phoneUser._id.toString() !== excludeUserId) {
        phoneExists = true;
      }
    }

    if (emailExists && phoneExists) {
      return res.status(409).json({ msg: 'Both email and phone number are already registered' });
    } else if (emailExists) {
      return res.status(409).json({ msg: 'Email is already registered' });
    } else if (phoneExists) {
      return res.status(409).json({ msg: 'Phone number is already registered' });
    }

    res.json({ msg: 'Email and phone are available' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   DELETE api/auth/delete-account
// @desc    Allow user to delete their own account (complete deletion)
// @access  Private
router.delete('/delete-account', auth, async (req, res) => {
  try {
    const userId = req.user.id;

    // Find the user first
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    console.log(`User ${user.email} requested account deletion`);

    // Check if user is a shop owner
    const Shop = require('../models/Shop');
    const ownedShop = await Shop.findOne({ owner: userId });

    if (ownedShop) {
      // If user is shop owner, check if there are any staff members
      if (ownedShop.staff && ownedShop.staff.length > 0) {
        return res.status(400).json({
          msg: 'Cannot delete account while you have staff members. Please remove all staff members from your shop first before deleting your account.',
          code: 'STAFF_EXISTS'
        });
      }

      // Check if any staff member accounts still exist in the database
      if (ownedShop.staff && ownedShop.staff.length > 0) {
        const existingStaff = await User.find({ _id: { $in: ownedShop.staff } });
        if (existingStaff.length > 0) {
          return res.status(400).json({
            msg: 'Some staff member accounts still exist. Please ensure all staff members delete their accounts first.',
            code: 'STAFF_ACCOUNTS_EXIST'
          });
        }
      }
    }

    // Delete all associated data (same logic as admin endpoint)
    const BarberCard = require('../models/BarberCard');
    const Booking = require('../models/Booking');
    const Review = require('../models/Review');
    const Notification = require('../models/Notification');
    const ChatMessage = require('../models/ChatMessage');
    const SetkarCoinTransaction = require('../models/SetkarCoinTransaction');

    // Delete barber cards
    await BarberCard.deleteMany({ barberId: userId });

    // Delete bookings (both as barber and customer)
    await Booking.deleteMany({ $or: [{ barberId: userId }, { userId: userId }] });

    // Delete reviews (both given and received)
    await Review.deleteMany({ $or: [{ barberId: userId }, { userId: userId }] });

    // Delete notifications
    await Notification.deleteMany({ userId: userId });

    // Delete chat messages
    await ChatMessage.deleteMany({ $or: [{ senderId: userId }, { receiverId: userId }] });

    // Delete coin transactions
    await SetkarCoinTransaction.deleteMany({ userId: userId });

    // Handle shop ownership/staff relationships
    if (ownedShop) {
      // If user is shop owner and no staff remain, delete the entire shop
      await Shop.findByIdAndDelete(ownedShop._id);
    } else {
      // If user is staff, remove them from staff array
      await Shop.updateMany(
        { staff: userId },
        { $pull: { staff: userId } }
      );
    }

    // Finally, delete the user account
    await User.findByIdAndDelete(userId);

    console.log(`User account deleted successfully: ${user.email} (${userId})`);

    res.json({
      msg: 'Account and all associated data deleted successfully',
      deletedUser: {
        id: userId,
        name: user.name,
        email: user.email
      }
    });
  } catch (err) {
    console.error('Account deletion error:', err.message, err.stack);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
