const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const SetkarCoinTransaction = require('../models/SetkarCoinTransaction');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { uploadToR2, extractKeyFromUrl, uploadToR2WithCleanup } = require('../utils/r2Storage');

// Ensure the uploads directory exists
const uploadsDir = path.join(__dirname, '../../barber-app/Uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Set up multer for file uploads (memory storage for R2)
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Ultra-efficient in-memory cache for user operations
const userCache = new Map();
const USER_CACHE_DURATION = 2 * 60 * 1000; // 2 minutes for user data

// Cache management functions
const getUserCached = (key) => {
  const cached = userCache.get(key);
  if (cached && Date.now() - cached.timestamp < USER_CACHE_DURATION) {
    return cached.data;
  }
  userCache.delete(key);
  return null;
};

const setUserCached = (key, data) => {
  userCache.set(key, { data, timestamp: Date.now() });
  // Prevent memory leaks - limit cache size
  if (userCache.size > 100) {
    const firstKey = userCache.keys().next().value;
    userCache.delete(firstKey);
  }
};

// @route   POST api/user/recharge-setkar-coins
// @desc    Recharge Setkar coins for a user (bypassing actual payment for now)
// @access  Private
router.post('/recharge-setkar-coins', auth, async (req, res) => {
  try {
    const { coins } = req.body;

    if (typeof coins !== 'number' || coins <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid coin amount.' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    let totalCoins = coins;
    let bonusCoins = 0;

    // Special offer: 10% extra coins for ₹100 recharge
    if (coins === 100) {
      bonusCoins = 10; // 10% of 100
      totalCoins = coins + bonusCoins;
    }

    user.setkarCoins = (user.setkarCoins || 0) + totalCoins;
    await user.save();

    // Create transaction record for main recharge
    const transaction = new SetkarCoinTransaction({
      userId: req.user.id,
      type: 'recharge',
      amount: coins,
      description: bonusCoins > 0 ? `Recharged ${coins} Setkar Coins + ${bonusCoins} bonus coins (10% extra)` : `Recharged ${coins} Setkar Coins`,
    });
    await transaction.save();

    // Create separate transaction record for bonus if applicable
    if (bonusCoins > 0) {
      const bonusTransaction = new SetkarCoinTransaction({
        userId: req.user.id,
        type: 'recharge',
        amount: bonusCoins,
        description: `Bonus: ${bonusCoins} Setkar Coins (10% extra on ₹100 recharge)`,
      });
      await bonusTransaction.save();
    }

    const message = bonusCoins > 0
      ? `Setkar Coins recharged successfully! You received ${coins} + ${bonusCoins} bonus coins (10% extra).`
      : 'Setkar Coins recharged successfully.';

    res.json({
      success: true,
      message: message,
      setkarCoins: user.setkarCoins,
      bonusCoins: bonusCoins
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// @route   POST api/user/redeem-setkar-coins
// @desc    Redeem Setkar coins for a user
// @access  Private
router.post('/redeem-setkar-coins', auth, async (req, res) => {
  try {
    const { coins } = req.body;

    if (typeof coins !== 'number' || coins <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid coin amount.' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    if (user.setkarCoins < coins) {
      return res.status(400).json({ success: false, message: 'Insufficient Setkar Coins.' });
    }

    user.setkarCoins -= coins;
    await user.save();

    // Create transaction record
    const transaction = new SetkarCoinTransaction({
      userId: req.user.id,
      type: 'redeem',
      amount: coins,
      description: `Redeemed ${coins} Setkar Coins`,
    });
    await transaction.save();

    res.json({ success: true, message: 'Setkar Coins redeemed successfully.', setkarCoins: user.setkarCoins });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// @route   GET api/user/setkar-coin-transactions
// @desc    Get Setkar coin transaction history for a user (ultra-optimized with caching)
router.get('/setkar-coin-transactions', auth, async (req, res) => {
  try {
    const cacheKey = `transactions_${req.user.id}`;
    const cached = getUserCached(cacheKey);

    if (cached) {
      return res.json({ success: true, transactions: cached });
    }

    // FIXED: Removed .lean() so Mongoose automatically decrypts the 'description' field
    const transactions = await SetkarCoinTransaction.find({ userId: req.user.id })
      .sort({ date: -1 }) // Most recent first
      .select('type amount description date');
      
    setUserCached(cacheKey, transactions);
    res.json({ success: true, transactions });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// @route   POST api/user/upload-profile-picture
// @desc    Upload profile picture for a user
// @access  Private
router.post('/upload-profile-picture', auth, upload.single('profilePicture'), async (req, res) => {
  try {
    if (!req.file) {
      console.log('❌ User profile picture upload: No file uploaded');
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    console.log('📤 User profile picture upload: File received:', {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size
    });

    // Check if R2 is configured
    const isR2Configured = process.env.R2_ACCESS_KEY_ID &&
                          process.env.R2_SECRET_ACCESS_KEY &&
                          process.env.R2_BUCKET_NAME &&
                          process.env.R2_ENDPOINT &&
                          process.env.R2_PUBLIC_URL &&
                          !process.env.R2_ACCESS_KEY_ID.includes('your_');

    console.log('🔍 R2 Configuration Status:', {
      isR2Configured,
      hasAccessKey: !!process.env.R2_ACCESS_KEY_ID,
      hasSecretKey: !!process.env.R2_SECRET_ACCESS_KEY,
      hasBucket: !!process.env.R2_BUCKET_NAME,
      hasEndpoint: !!process.env.R2_ENDPOINT,
      hasPublicUrl: !!process.env.R2_PUBLIC_URL
    });

    // Get current user to find existing profile picture for cleanup
    let currentUser = null;
    try {
      currentUser = await User.findById(req.user.id);
    } catch (dbErr) {
      console.log('⚠️ Could not fetch current user for cleanup:', dbErr.message);
    }

    const oldImageUrl = currentUser?.profilePicture;

    if (isR2Configured) {
      console.log('☁️ Attempting upload to Cloudflare R2 with cleanup...');
      console.log('📋 Old profile picture URL for cleanup:', oldImageUrl);

      // Upload to Cloudflare R2 with automatic cleanup of old image
      const uploadResult = await uploadToR2WithCleanup(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype,
        'profile-pictures',
        oldImageUrl
      );

      if (uploadResult.success) {
        console.log('✅ User profile picture uploaded to R2:', uploadResult.url);

        // Update user profile picture
        await User.findByIdAndUpdate(req.user.id, { profilePicture: uploadResult.url });

        // Test if the uploaded file is accessible
        try {
          const https = require('https');
          const testUrl = uploadResult.url;

          console.log('🧪 Testing user profile picture R2 file accessibility:', testUrl);

          https.get(testUrl, (res) => {
            console.log('🧪 User profile picture R2 Access Test - Status:', res.statusCode);
            if (res.statusCode === 200) {
              console.log('✅ User profile picture R2 file is publicly accessible');
            } else {
              console.log('⚠️ User profile picture R2 file access returned status:', res.statusCode);
            }
          }).on('error', (err) => {
            console.log('⚠️ User profile picture R2 access test failed:', err.message);
          });

        } catch (testErr) {
          console.log('⚠️ Could not test user profile picture R2 accessibility:', testErr.message);
        }

        res.json({ success: true, message: 'Profile picture uploaded successfully', imageUrl: uploadResult.url });
        return;
      } else {
        console.warn('⚠️ R2 upload failed, falling back to local storage:', uploadResult.error);
      }
    } else {
      console.log('📁 R2 not configured, using local storage fallback');
    }

    // Fallback to local storage
    const filename = `profilePicture-${Date.now()}${path.extname(req.file.originalname)}`;
    const filepath = path.join(uploadsDir, filename);

    console.log('💾 Saving profile picture to local storage:', filepath);

    // Write buffer to file
    fs.writeFileSync(filepath, req.file.buffer);

    // Construct the URL for the uploaded image
    const imageUrl = `/Uploads/${filename}`;

    // Update user profile picture
    await User.findByIdAndUpdate(req.user.id, { profilePicture: imageUrl });

    console.log('✅ User profile picture saved locally:', imageUrl);
    res.json({ success: true, message: 'Profile picture uploaded successfully', imageUrl });
  } catch (err) {
    console.error('❌ Error uploading user profile picture:', err);
    res.status(500).json({ success: false, message: 'Server Error', error: err.message });
  }
});

module.exports = router;