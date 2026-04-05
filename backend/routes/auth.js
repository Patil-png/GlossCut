const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const User = require('../models/User');
const Shop = require('../models/Shop');
const BarberCard = require('../models/BarberCard');
const { isAuthenticated, optionalAuth, isAdmin } = require('../middleware/auth');
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');
const nodemailer = require('nodemailer');
const multer = require('multer');
const crypto = require('crypto');
const { uploadToR2WithCleanup } = require('../utils/r2Storage');
const sharp = require('sharp');
const { createHMAC, normalizePhone } = require('../utils/EncryptionService');
const AuditLogger = require('../middleware/auditMiddleware');
const cache = require('memory-cache');
const validate = require('../middleware/validate');
const schemas = require('../utils/validationSchemas');
const { checkEffectiveSubscription } = require('../utils/subscriptionHelper');
const whatsappService = require('../utils/whatsappService');
const rateLimit = require('express-rate-limit');
const h3 = require('h3-js');
const { encrypt, decrypt } = require('../utils/EncryptionService');

// @route   GET api/auth/check-exists
// @desc    Check if email or phone already exists (public for signup validation)
// @access  Public
router.get('/check-exists', async (req, res) => {
  const { email, phone } = req.query;

  try {
    if (email) {
      const emailHash = createHMAC(email.toLowerCase().trim());
      const existingEmail = await User.findOne({ emailHash });
      if (existingEmail) {
        return res.json({ exists: true, msg: 'This email is already registered', field: 'email' });
      }
    }

    if (phone) {
      const normalized = normalizePhone(phone);
      const phoneHash = createHMAC(normalized);
      
      // 1. Check if it exists as a User's phone
      const existingPhone = await User.findOne({ phoneHash });
      if (existingPhone) {
        return res.json({ exists: true, msg: 'This phone number is already registered to a user', field: 'phone' });
      }

      // 2. Check if it exists as a Shop's phone
      const existingShopPhone = await Shop.findOne({ phone: normalized });
      if (existingShopPhone) {
        return res.json({ exists: true, msg: 'This business phone is already registered to another salon', field: 'shopPhone' });
      }
    }

    res.json({ exists: false });
  } catch (err) {
    console.error('Error checking user existence:', err);
    res.status(500).json({ msg: 'Server Error' });
  }
});

// WhatsApp OTP Rate Limiter (Prevent bombing)
const whatsappLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // 20 OTPs per hour per IP (Increased for dev testing)
  message: { error: 'Too many OTP requests from this IP. Please try again after an hour.' },
  standardHeaders: true,
  legacyHeaders: false,
});


// ALIAS: Allow both 'auth' and 'isAuthenticated' to work if other files import differently
const auth = isAuthenticated;

// Multer memory storage for R2 uploads
const upload = multer({ storage: multer.memoryStorage() });

/**
 * ============================================================================
 * 1. GOOGLE OAUTH (FIXED FOR MOBILE DEEP LINKING)
 * ============================================================================
 */

// @route   GET /auth/google
router.get('/google', (req, res, next) => {
  // 1. Capture the mobile deep link sent from frontend (AuthContext.js)
  const mobileRedirect = req.query.mobile_redirect;
  const loginOnly = req.query.login_only === '1' || req.query.login_only === 'true';
  const requiredRole = req.query.required_role || req.query.role || null;

  // 2. Build a state that preserves redirect, login-only flag and any required role
  // State can be returned by Google and will be available in the callback as req.query.state
  let state;
  if (mobileRedirect && loginOnly) state = `${mobileRedirect}|login_only=1${requiredRole ? `|required_role=${requiredRole}` : ''}`;
  else if (mobileRedirect) state = `${mobileRedirect}${requiredRole ? `|required_role=${requiredRole}` : ''}`;
  else if (loginOnly) state = `login_only=1${requiredRole ? `|required_role=${requiredRole}` : ''}`;
  else if (requiredRole) state = `required_role=${requiredRole}`;

  // 3. Configure Passport options
  const prompt = req.query.prompt || 'select_account'; // Allow frontend to override, default to select_account

  const options = {
    scope: ['profile', 'email'],
    prompt: prompt,
    // Pass the composed state (may be undefined)
    state
  };

  passport.authenticate('google', options)(req, res, next);
});

// @route   GET /auth/google/callback
router.get('/google/callback', (req, res, next) => {
  passport.authenticate('google', { session: true }, async (err, user, info) => {
    try {
      if (err) {
        console.error('OAuth callback error:', err);
        return res.redirect('/login');
      }

      // Parse state for login-only and mobile redirect (if any)
      const rawState = req.query.state || '';
      const decodedState = rawState ? decodeURIComponent(rawState) : '';
      let loginOnly = false;
      let mobileRedirect = null;
      let mobileRequiredRole = null;

      // Log raw vs decoded state for debugging mobile flows
      console.log('OAuth callback state (raw):', rawState);
      console.log('OAuth callback state (decoded):', decodedState);

      if (decodedState) {
        const parts = decodedState.split('|');
        parts.forEach(p => {
          if (p.includes('login_only=1') || p.includes('login_only=true')) loginOnly = true;
          if (p.includes('://')) mobileRedirect = p;
          if (p.includes('required_role=') || p.includes('role=')) {
            const m = p.match(/(?:required_role|role)=([^|]+)/);
            if (m && m[1]) {
              // Normalize to lowercase
              try { mobileRequiredRole = decodeURIComponent(m[1]).toLowerCase(); } catch (e) { mobileRequiredRole = m[1].toLowerCase(); }
            }
          }
        });
      }

      if (!user) {
        // Check if passport returned a specific reason (role mismatch)
        const infoMessage = info?.message || '';
        const infoRole = info?.requiredRole || mobileRequiredRole;

        if (infoMessage === 'role_not_allowed') {
          // Role mismatch: redirect back with role-specific error
          if (mobileRedirect) {
            const redirectWithError = mobileRedirect.includes('?')
              ? `${mobileRedirect}&error=role_not_allowed${infoRole ? `&required_role=${infoRole}` : ''}`
              : `${mobileRedirect}?error=role_not_allowed${infoRole ? `&required_role=${infoRole}` : ''}`;
            console.log('OAuth role mismatch for mobileRedirect, redirecting with error:', redirectWithError);
            return res.redirect(redirectWithError);
          }

          const base = process.env.BASE_URL ? process.env.BASE_URL.replace(/\/$/, '') : '';
          const loginUrl = `${base}/login?error=role_not_allowed${infoRole ? `&required_role=${infoRole}` : ''}`;
          console.log('OAuth role mismatch for web flow, redirecting to web login with error:', loginUrl);
          return res.redirect(loginUrl);
        }

        // Default: Login-only requested but no existing user found -> redirect back with error
        if (mobileRedirect) {
          // Append login_only flag so mobile app knows signup was explicitly disallowed
          const redirectWithError = mobileRedirect.includes('?')
            ? `${mobileRedirect}&error=signup_not_allowed${loginOnly ? '&login_only=1' : ''}`
            : `${mobileRedirect}?error=signup_not_allowed${loginOnly ? '&login_only=1' : ''}`;
          console.log('OAuth login-only denied for mobileRedirect, redirecting with error:', redirectWithError);
          return res.redirect(redirectWithError);
        }
        // For web flows, redirect back to the login page with an explicit error (so web UI can show the same message)
        const base = process.env.BASE_URL ? process.env.BASE_URL.replace(/\/$/, '') : '';
        const loginUrl = `${base}/login${loginOnly ? '?error=signup_not_allowed&login_only=1' : '?error=signup_not_allowed'}`;
        console.log('OAuth login-only denied for web flow, redirecting to web login with error:', loginUrl);
        return res.redirect(loginUrl);
      }

      // Log Success
      await AuditLogger.log({
        userId: user._id,
        action: 'LOGIN',
        entity: 'User',
        entityId: user._id,
        changes: { method: 'google_oauth' },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      // Generate JWT
      const token = jwt.sign(
        { user: { id: user._id } },
        process.env.JWT_SECRET || 'secret',
        { expiresIn: '7d' }
      );

      // If we have a mobile redirect (deep link), send the token there; otherwise send to web dashboard
      if (mobileRedirect) {
        console.log(`Redirecting to Mobile App: ${mobileRedirect}`);
        console.log('OAuth token length:', token ? token.length : 0);

        // Safely attach token as a query param even if mobileRedirect has existing query or fragment
        let redirectUrl;
        try {
          // Prefer using URL API for safety
          const urlObj = new URL(mobileRedirect);
          urlObj.searchParams.set('token', token);
          redirectUrl = urlObj.toString();
        } catch (e) {
          // Fallback for custom schemes or malformed URLs
          const [base, hash] = mobileRedirect.split('#');
          const sep = base.includes('?') ? '&' : '?';
          redirectUrl = `${base}${sep}token=${encodeURIComponent(token)}${hash ? `#${hash}` : ''}`;
        }

        console.log('Redirect URL to mobile app:', redirectUrl);
        return res.redirect(redirectUrl);
      }

      // Web fallback
      console.log('Redirecting to Web Dashboard');
      return res.redirect(`${process.env.BASE_URL}/dashboard`);

    } catch (error) {
      console.error('Error handling OAuth callback:', error);
      return res.redirect('/login');
    }
  })(req, res, next);
});

/**
 * ============================================================================
 * 2. HYBRID AUTH STATUS
 * ============================================================================
 */

// @route   GET /auth/status
// @desc    Check auth status (Works for both Session & JWT via optionalAuth)
router.get('/status', optionalAuth, async (req, res) => {
  if (req.user) {
    // If user is a barber, fetch shop category too (preserving your logic)
    let extraData = {};
    if (req.user.role === 'barber') {
      const shop = await Shop.findOne({ $or: [{ owner: req.user._id }, { staff: req.user._id }] }).select('category _id');
      if (shop) {
        extraData.shopId = shop._id;
        extraData.shopCategory = shop.category;
        extraData.isMainOwner = shop.owner.toString() === req.user._id.toString();
      } else {
        extraData.isMainOwner = false;
      }
    }

    res.json({
      isAuthenticated: true,
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        profilePicture: req.user.profilePicture,
        ...extraData,
        isSubscribed: (await checkEffectiveSubscription(req.user._id)).isActive
      }
    });
  } else {
    res.json({ isAuthenticated: false });
  }
});

/**
 * ============================================================================
 * 3. REGISTRATION (HYBRID + COMPLEX BARBER LOGIC)
 * ============================================================================
 */

// @route   POST /auth/register
// @route   POST /auth/register
router.post('/register', validate(schemas.register), async (req, res) => {
  const {
    name, email, password, phone, role = 'customer', gender,
    shopName, shopAddress, shopPhone, category, selectedShopId, isShopOwner
  } = req.body;

  console.log('Registration attempt:', { name, email, phone, role });

  try {
    // --- WhatsApp Verification Check (for Customers) - Temporarily Bypassed ---
    /*
    if (role === 'customer' && phone) {
      const isVerified = cache.get(`verified_phone_${phone}`);
      if (!isVerified) {
        return res.status(400).json({ error: 'Phone number NOT verified. Please verify via WhatsApp first.' });
      }
      // Consume verification
      cache.del(`verified_phone_${phone}`);
    }
    */

    // --- Validation ---
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long' });
    }

    // --- Uniqueness Check (Using HASHES for encrypted fields) ---
    const emailHash = createHMAC(email.toLowerCase());
    const existingUser = await User.findOne({ emailHash });
    if (existingUser) {
      return res.status(400).json({ msg: 'Email is already registered', field: 'email' });
    }

    if (phone) {
      const normalized = normalizePhone(phone);
      const phoneHash = createHMAC(normalized);
      const existingPhone = await User.findOne({ phoneHash });
      if (existingPhone) {
        return res.status(400).json({ msg: 'Phone number is already registered', field: 'phone' });
      }
    }

    // --- Create User ---
    const user = new User({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: password, // Pre-save hook will hash this
      phone: phone ? phone.trim() : undefined,
      role,
      gender,
      isEmailVerified: false,
    });

    // Add Email Verification Token
    user.emailVerificationToken = crypto.randomBytes(32).toString('hex');
    user.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

    await user.save();

    // --- Complex Barber/Shop Logic (Preserved from your original code) ---
    if (role === 'barber') {
      console.log('Processing Barber Logic for:', user.email);
      try {
        let shop;

        // A. Join Existing Shop
        if (selectedShopId && selectedShopId !== 'new' && selectedShopId !== null && !isShopOwner) {
          const existingShop = await Shop.findById(selectedShopId);
          if (existingShop) {
            if (!existingShop.staff.includes(user.id)) {
              existingShop.staff.push(user.id);
              await existingShop.save();
            }
            shop = existingShop;
          }
        }
        // B. Create New Shop
        else if (isShopOwner || selectedShopId === 'new') {
          if (!shopName || !shopAddress || !shopPhone) {
            // Cleanup user if shop fails (Atomic-like behavior)
            await User.findByIdAndDelete(user._id);
            return res.status(400).json({ msg: 'Shop details required for shop owners' });
          }

          // --- SPATIAL DETECTION: Parse coordinates from address string or request body ---
          let parsedLocation;
          let computedH3Index;
          try {
            const addrObj = typeof shopAddress === 'string' ? JSON.parse(shopAddress) : shopAddress;
            const lat = parseFloat(addrObj.latitude || req.body.latitude);
            const lng = parseFloat(addrObj.longitude || req.body.longitude);
            
            if (!isNaN(lat) && !isNaN(lng)) {
              parsedLocation = { type: 'Point', coordinates: [lng, lat] };
              computedH3Index = h3.latLngToCell(lat, lng, 9);
            }
          } catch (e) {
            console.log('Failed to parse spatial data during registration shop creation.');
          }

          shop = new Shop({
            owner: user.id,
            name: shopName,
            address: shopAddress,
            phone: shopPhone,
            category: category || 'Barber',
            location: parsedLocation,
            h3Index: computedH3Index,
            approvalStatus: 'pending',
          });
          await shop.save();

          // --- Grant 1-Month Free Trial for New Shop Owners ---
          user.subscriptionStatus = 'active';
          user.subscriptionExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
          user.isTrial = true;
          await user.save();
          console.log(`Free trial granted to new shop owner: ${user.email}`);
        }

        // C. Create Barber Card
        if (shop) {
          const barberCard = new BarberCard({
            barberId: user.id,
            shopId: shop._id,
            name: user.name,
            services: [],
            approvalStatus: 'pending_owner_approval',
            isAvailable: true,
          });
          await barberCard.save();
        }

      } catch (shopError) {
        console.error('Shop creation failed:', shopError);
        return res.status(500).json({ msg: 'Failed to configure shop details', error: shopError.message });
      }
    }

    // --- Audit Log ---
    await AuditLogger.log({
      userId: user._id,
      action: 'USER_REGISTER',
      entity: 'User',
      entityId: user._id,
      changes: { method: 'email', role },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    // --- Generate JWT (For Mobile) ---
    const token = jwt.sign(
      { user: { id: user.id } },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' }
    );

    // --- Return Hybrid Response ---
    res.status(201).json({
      message: 'Registration successful',
      token, // Mobile uses this
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isEmailVerified: user.isEmailVerified
      }
    });

  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * ============================================================================
 * 4. LOGIN (HYBRID: SESSION + JWT)
 * ============================================================================
 */

// @route   POST /auth/login
// @desc    Unified Login (Replaces /login and /barber/login)
// @desc    Unified Login (Replaces /login and /barber/login)
router.post(['/login', '/barber/login'], validate(schemas.login), async (req, res) => {
  const { email, password } = req.body;

  // Check if this was called via the /barber/login route
  const isBarberLogin = req.path.includes('barber');

  try {
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // 1. Lookup by Hash (Encryption Support)
    const emailHash = createHMAC(email.toLowerCase());
    const user = await User.findOne({ emailHash });

    if (!user) {
      return res.status(400).json({ msg: 'Invalid Credentials' });
    }

    // 2. Role Check (If hitting /barber/login endpoint)
    if (isBarberLogin && user.role !== 'barber') {
      return res.status(401).json({ msg: 'Not authorized: Barber account required' });
    }

    // 3. Password Check
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      await AuditLogger.log({
        userId: user._id,
        action: 'USER_LOGIN_FAILED',
        entity: 'User',
        entityId: user._id,
        changes: { reason: 'bad_password' },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });
      return res.status(400).json({ msg: 'Invalid Credentials' });
    }

    // 4. Update Stats
    user.lastLogin = new Date();
    user.loginCount = (user.loginCount || 0) + 1;
    await user.save();

    // 5. Audit Log
    await AuditLogger.log({
      userId: user._id,
      action: 'USER_LOGIN',
      entity: 'User',
      entityId: user._id,
      changes: { method: 'password', success: true },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    // 6. Generate JWT (For Mobile)
    const token = jwt.sign(
      { user: { id: user.id } },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' }
    );

    // 7. Establish Session (For Web)
    req.login(user, (err) => {
      if (err) {
        console.error('Session login error:', err);
        // We still return token if session fails, or fail completely. 
        // Let's fail safe.
        return res.status(500).json({ error: 'Session creation failed' });
      }

      // 8. Return Hybrid Response
      res.json({
        message: 'Login successful',
        token, // Used by Mobile
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          profilePicture: user.profilePicture,
          isEmailVerified: user.isEmailVerified
        }
      });
    });

  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST /auth/logout
router.post('/logout', optionalAuth, async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Authentication required' });
    const userId = req.user._id;

    // CRITICAL FIX: Clear push token so this device stops receiving notifications for this account
    const user = await User.findById(userId);
    if (user) {
      console.log(`🔔 Clearing push token for user: ${user.name} (${userId})`);
      user.expoPushToken = null; // Clear the token  
      await user.save();
    }

    // OPTIMIZATION: Clear cache on logout
    cache.del(`user_${userId}`);

    await AuditLogger.log({
      userId: userId,
      action: 'USER_LOGOUT',
      entity: 'User',
      entityId: userId,
      changes: { expoPushTokenCleared: true },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    req.logout((err) => {
      if (err) return res.status(500).json({ error: 'Logout failed' });

      req.session.destroy((err) => {
        if (err) return res.status(500).json({ error: 'Session cleanup failed' });

        res.clearCookie('setkarr.sid');
        res.json({ message: 'Logged out successfully' });
      });
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * ============================================================================
 * 5. PROFILE MANAGEMENT (Merged Extensive Logic)
 * ============================================================================
 */

// @route   GET /auth/profile (or /auth/user)
// Accept either session or JWT auth (mobile uses JWT)
router.get(['/profile', '/user'], optionalAuth, async (req, res) => {
  try {
    // Require an authenticated user (either via session or JWT)
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const user = await User.findById(req.user._id).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Add Shop Category if Barber
    if (user.role === 'barber') {
      const shop = await Shop.findOne({ $or: [{ owner: user._id }, { staff: user._id }] }).select('category _id owner');
      const payload = { user: user.toObject() };

      const isMainOwner = shop ? shop.owner.toString() === user._id.toString() : false;
      if (shop) {
        payload.shopCategory = shop.category;
        payload.shopId = shop._id;
        // Also attach to the raw user object for clients expecting it there
        user._doc.shopId = shop._id;
        user._doc.shopCategory = shop.category;
      }

      const sub = await checkEffectiveSubscription(user._id);
      user._doc.isSubscribed = sub.isActive; // Add to direct user object
      user._doc.isMainOwner = isMainOwner;
      payload.isSubscribed = sub.isActive;   // Add to payload wrapper
      payload.isMainOwner = isMainOwner;

      // Match existing clients: '/user' returns direct user object, '/profile' returns wrapper
      return req.path === '/user' ? res.json(user) : res.json(payload);
    }

    const sub = await checkEffectiveSubscription(user._id);
    user._doc.isSubscribed = sub.isActive;

    // Return user object (match existing clients: '/user' returns direct object)
    return req.path === '/user' ? res.json(user) : res.json({ user, isSubscribed: sub.isActive });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   PUT /auth/profile (Replaces /profile AND /user PUTs)
// Changed to optionalAuth to support both Session (Web) and JWT (Mobile)
router.put(['/profile', '/user'], optionalAuth, async (req, res) => {
  try {
    // Enforce authentication manually since we used optionalAuth
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // We accept ALL fields from both your original Web and Mobile versions
    const {
      name, phone, gender, language, notificationsEnabled, // Web fields
      email, profilePicture, maxAppointmentsPerDay, isAvailable, // Mobile fields
      concurrentServiceCapacity, // Added for parallel service support
      shopName, shopAddress, shopPhone, shopImage, // Barber fields
      pushToken, expoPushToken // Push Notification Token
    } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Update User Fields
    if (name) user.name = name;
    if (gender) user.gender = gender;
    if (language) user.language = language;
    if (notificationsEnabled !== undefined) user.notificationsEnabled = notificationsEnabled;
    if (profilePicture) user.profilePicture = profilePicture;
    if (maxAppointmentsPerDay) user.maxAppointmentsPerDay = maxAppointmentsPerDay;
    if (concurrentServiceCapacity) user.concurrentServiceCapacity = concurrentServiceCapacity;
    if (isAvailable !== undefined) user.isAvailable = isAvailable;
    if (pushToken) user.expoPushToken = pushToken;
    if (expoPushToken) user.expoPushToken = expoPushToken;

    // Handle Encryption Fields (Hash updates handled by Pre-Save Hook)
    if (phone) user.phone = phone;
    if (email) user.email = email.toLowerCase();

    await user.save();

    // Update Shop Logic (If Barber)
    if (user.role === 'barber') {
      const shop = await Shop.findOne({ owner: user._id });
      if (shop) {
        if (shopName) shop.name = shopName;
        if (shopAddress) shop.address = shopAddress;
        if (shopPhone) shop.phone = shopPhone;
        if (shopImage) shop.image = shopImage;
        await shop.save();
      }
    }

    // Audit
    await AuditLogger.log({
      userId: user._id,
      action: 'PROFILE_UPDATE',
      entity: 'User',
      entityId: user._id,
      changes: { updatedFields: Object.keys(req.body) },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    // OPTIMIZATION: Clear cache on profile update
    cache.del(`user_${user._id}`);

    res.json({ message: 'Profile updated', user });

  } catch (error) {
    console.error('Profile update error:', error);
    if (error.code === 11000) return res.status(409).json({ error: 'Email or Phone already taken' });
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST api/auth/upload-picture
router.post('/upload-picture', auth, upload.single('profilePicture'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ msg: 'No file uploaded' });

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ msg: 'User not found' });

    let uploadBuffer = req.file.buffer;
    let uploadFilename = req.file.originalname;
    let uploadMimetype = req.file.mimetype;

    // Optimize Image
    if (req.file.mimetype.startsWith('image')) {
      console.log(`🖼️ Optimizing profile picture (auth): ${req.file.originalname}`);
      try {
        uploadBuffer = await sharp(req.file.buffer)
          .rotate() // Auto-rotate based on EXIF data
          .resize({ width: 800, withoutEnlargement: true })
          .webp({ quality: 80 })
          .toBuffer();

        uploadFilename = `${path.parse(req.file.originalname).name}.webp`;
        uploadMimetype = 'image/webp';
        console.log(`✅ Profile picture optimized. Size reduction: ${((req.file.size - uploadBuffer.length) / 1024).toFixed(2)} KB`);
      } catch (sharpError) {
        console.error('❌ Sharp optimization failed:', sharpError.message);
      }
    }

    const result = await uploadToR2WithCleanup(
      uploadBuffer,
      uploadFilename,
      uploadMimetype,
      'profile-pictures',
      user.profilePicture
    );

    if (result.success) {
      user.profilePicture = result.url;
      await user.save();

      // OPTIMIZATION: Clear cache on picture upload
      cache.del(`user_${req.user.id}`);

      res.json({ imageUrl: result.url });
    } else {
      res.status(500).json({ msg: 'Upload failed', error: result.error });
    }
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

/**
 * ============================================================================
 * 6. ACCOUNT RECOVERY
 * ============================================================================
 */

// @route   POST /auth/verify-email/:token
router.post('/verify-email/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const user = await User.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: new Date() }
    });

    if (!user) return res.status(400).json({ error: 'Invalid or expired token' });

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    await AuditLogger.log({
      userId: user._id,
      action: 'EMAIL_VERIFIED',
      entity: 'User',
      entityId: user._id,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({ message: 'Email verified successfully', user });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /auth/forgot-password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email required' });

    const emailHash = createHMAC(email.toLowerCase());
    const user = await User.findOne({ emailHash });

    if (user) {
      // Generate a 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      user.passwordResetToken = otp;
      user.passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
      await user.save();

      await AuditLogger.log({
        userId: user._id,
        action: 'PASSWORD_RESET_REQUEST',
        entity: 'User',
        entityId: user._id,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      console.log('OTP generated for:', user.email);

      // --- Resend HTTP API ---
      const emailHtml = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/><title>Reset Your GlossCut Password</title><style>*{box-sizing:border-box}body{margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;-webkit-text-size-adjust:100%}.wrapper{padding:40px 16px;background:#f4f4f5}.card{background:#fff;border-radius:12px;max-width:540px;margin:0 auto;border:1px solid #e4e4e7}.header{padding:32px 40px 28px;border-bottom:1px solid #f4f4f5}.logo{font-size:15px;font-weight:700;color:#09090b;letter-spacing:.5px;text-transform:uppercase}.body{padding:36px 40px}.title{font-size:22px;font-weight:700;color:#09090b;margin:0 0 12px;letter-spacing:-.3px}.body-text{color:#71717a;font-size:15px;line-height:1.65;margin:0 0 32px}.otp-wrapper{background:#09090b;border-radius:10px;padding:28px;text-align:center;margin:0 0 32px}.otp-label{color:#a1a1aa;font-size:10px;font-weight:600;letter-spacing:2.5px;text-transform:uppercase;margin:0 0 12px}.otp-digits{color:#fff;font-size:44px;font-weight:800;letter-spacing:14px;font-family:'Courier New',monospace;line-height:1}.expiry{color:#a1a1aa;font-size:12px;margin:10px 0 0}.divider{border:none;border-top:1px solid #f4f4f5;margin:0}.note{color:#a1a1aa;font-size:12.5px;line-height:1.6;margin:0}.footer{padding:20px 40px;background:#fafafa;border-top:1px solid #f4f4f5;border-radius:0 0 12px 12px;display:flex;justify-content:space-between;align-items:center}.footer-left{color:#a1a1aa;font-size:12px}.footer-right a{color:#a1a1aa;font-size:12px;text-decoration:none}@media only screen and (max-width:600px){.wrapper{padding:20px 8px}.header{padding:24px 24px 20px}.body{padding:28px 24px}.footer{padding:16px 24px;flex-direction:column;gap:4px;text-align:center}.otp-digits{font-size:34px;letter-spacing:10px}}</style></head><body><div class="wrapper"><div class="card"><div class="header"><div class="logo">GlossCut</div></div><div class="body"><h1 class="title">Password Reset Code</h1><p class="body-text">Hi <strong style="color:#09090b;">${user.name}</strong>,<br>Use the one-time code below to reset your password. The code expires in <strong style="color:#09090b;">10 minutes</strong> and can only be used once.</p><div class="otp-wrapper"><p class="otp-label">One-Time Code</p><div class="otp-digits">${otp}</div><p class="expiry">Expires in 10 minutes</p></div><hr class="divider"/><br><p class="note">If you didn't request a password reset, no action is needed — your account is safe. If this seems suspicious, contact us at <a href="mailto:support@glosscut.com" style="color:#09090b;text-decoration:underline">support@glosscut.com</a>.</p></div><div class="footer"><span class="footer-left">&copy; ${new Date().getFullYear()} GlossCut</span><span class="footer-right"><a href="https://glosscut.com">glosscut.com</a></span></div></div></div></body></html>`;
      try {
        const resendResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${ process.env.EMAIL_PASS } `,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: 'GlossCut Grooming <support@glosscut.com>',
            to: [user.email],
            subject: 'Your GlossCut Password Reset OTP',
            html: emailHtml
          })
        });

        if (resendResponse.ok) {
          console.log(`OTP email sent to: ${ user.email } `);
        } else {
          const errorData = await resendResponse.json();
          console.error('Resend API error:', errorData);
        }
      } catch (mailError) {
        console.error('Failed to send OTP email:', mailError);
      }
    }

    res.json({ message: 'If account exists, OTP has been sent.' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /auth/verify-otp
// @desc    Verify the 6-digit OTP and return a short-lived reset token
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ error: 'Email and OTP required' });

    const emailHash = createHMAC(email.toLowerCase());
    const user = await User.findOne({
      emailHash,
      passwordResetToken: otp.toString(),
      passwordResetExpires: { $gt: new Date() }
    });

    if (!user) return res.status(400).json({ error: 'Invalid or expired OTP' });

    // OTP is valid — generate a new random reset token (the OTP is now consumed)
    const resetToken = crypto.randomBytes(32).toString('hex');
    user.passwordResetToken = resetToken;
    user.passwordResetExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes to complete reset
    await user.save();

    res.json({ message: 'OTP verified', resetToken });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /auth/reset-password/:token
router.post('/reset-password/:token', async (req, res) => {
  try {
    const { password } = req.body;
    if (!password || password.length < 8) return res.status(400).json({ error: 'Password too short (min 8 chars)' });

    const user = await User.findOne({
      passwordResetToken: req.params.token,
      passwordResetExpires: { $gt: new Date() }
    });

    if (!user) return res.status(400).json({ error: 'Invalid or expired token. Please request a new OTP.' });

    user.password = password; // Pre-save hook hashes it
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    await AuditLogger.log({
      userId: user._id,
      action: 'PASSWORD_RESET',
      entity: 'User',
      entityId: user._id,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});




/**
 * ============================================================================
 * 7. UTILS & HELPERS (2FA, Likes, Deletion)
 * ============================================================================
 */

// 2FA Routes
// @route   POST api/auth/2fa/send-otp
router.post('/2fa/send-otp', optionalAuth, async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Authentication required' });
    const user = await User.findById(req.user.id);

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    user.twoFactorOtp = otp;
    user.twoFactorOtpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
    await user.save();

    // Send Email
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL,
        pass: process.env.PASSWORD,
      },
    });

    const userEmail = decrypt(user.email);
    const mailOptions = {
      from: process.env.EMAIL,
      to: userEmail,
      subject: 'Verification Code - SetKarr',
      text: `Your verification code is: ${ otp }. It expires in 10 minutes.`,
    };

    transporter.sendMail(mailOptions, (err, info) => {
      if (err) {
        console.error('Error sending OTP email:', err);
        return res.status(500).json({ msg: 'Failed to send email' });
      }
      res.json({ msg: 'Code sent to email' });
    });

  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/auth/2fa/verify
router.post('/2fa/verify', optionalAuth, async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Authentication required' });
  const { token } = req.body;

  if (!token) return res.status(400).json({ msg: 'Token required' });

  try {
    const user = await User.findById(req.user.id);

    // 1. Check TOTP (Authenticator App)
    let verified = false;
    if (user.twoFactorSecret) {
      verified = speakeasy.totp.verify({
        secret: user.twoFactorSecret,
        encoding: 'base32',
        token
      });
    }

    // 2. Check Email OTP (Fallback or Primary)
    if (!verified && user.twoFactorOtp) {
      if (user.twoFactorOtp === token && user.twoFactorOtpExpires > Date.now()) {
        verified = true;

        // Consume OTP (Prevent Replay)
        user.twoFactorOtp = undefined;
        user.twoFactorOtpExpires = undefined;
        await user.save();
      }
    }

    if (verified) {
      await User.findByIdAndUpdate(req.user.id, { twoFactorEnabled: true });
      res.json({ msg: 'Verified successfully' });
    } else {
      res.status(400).json({ msg: 'Invalid or expired code' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

// Public User Read (for Authenticated Users)
router.get('/user/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ msg: 'User not found' });

    if (user.role === 'barber') {
      const shop = await Shop.findOne({ owner: user._id }).select('category');
      if (shop) return res.json({ ...user.toObject(), shopCategory: shop.category });
    }
    res.json(user);
  } catch (err) { res.status(500).send('Server Error'); }
});

// Check Uniqueness (Registration Helper)
router.post('/check-uniqueness', async (req, res) => {
  const { email, phone, excludeUserId } = req.body;
  try {
    let emailExists = false, phoneExists = false;

    if (email) {
      const emailHash = createHMAC(email.toLowerCase());
      const u = await User.findOne({ emailHash });
      if (u && u._id.toString() !== excludeUserId) emailExists = true;
    }

    if (phone) {
      const normalized = normalizePhone(phone);
      const phoneHash = createHMAC(normalized);
      const u = await User.findOne({ phoneHash });
      if (u && u._id.toString() !== excludeUserId) phoneExists = true;
    }

    if (emailExists && phoneExists) return res.status(409).json({ msg: 'Both taken' });
    if (emailExists) return res.status(409).json({ msg: 'Email taken' });
    if (phoneExists) return res.status(409).json({ msg: 'Phone taken' });

    res.json({ msg: 'Available' });
  } catch (err) { res.status(500).send('Server Error'); }
});

// Delete Account
router.delete('/delete-account', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ msg: 'User not found' });

    // Shop Owner Checks
    const ownedShop = await Shop.findOne({ owner: userId });
    if (ownedShop && ownedShop.staff.length > 0) {
      const staffCount = await User.countDocuments({ _id: { $in: ownedShop.staff } });
      if (staffCount > 0) {
        return res.status(400).json({ msg: 'Cannot delete account while you have active staff.' });
      }
    }

    // Cleanup
    const Booking = require('../models/Booking');
    const Review = require('../models/Review');
    const Notification = require('../models/Notification');
    const ChatMessage = require('../models/ChatMessage');
    const SetkarCoinTransaction = require('../models/SetkarCoinTransaction');

    await BarberCard.deleteMany({ barberId: userId });
    await Booking.deleteMany({ $or: [{ barberId: userId }, { userId: userId }] });
    await Review.deleteMany({ $or: [{ barberId: userId }, { userId: userId }] });
    await Notification.deleteMany({ userId: userId });
    await ChatMessage.deleteMany({ $or: [{ senderId: userId }, { receiverId: userId }] });
    await SetkarCoinTransaction.deleteMany({ userId: userId });

    if (ownedShop) {
      await Shop.findByIdAndDelete(ownedShop._id);
    } else {
      await Shop.updateMany({ staff: userId }, { $pull: { staff: userId } });
    }

    await User.findByIdAndDelete(userId);

    await AuditLogger.log({
      userId: userId,
      action: 'ACCOUNT_DELETED',
      entity: 'User',
      entityId: userId,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({ msg: 'Account deleted' });
  } catch (err) {
    console.error('Delete error:', err);
    res.status(500).send('Server Error');
  }
});

// Likes/Unlikes/Tokens
router.post('/like', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user.likedBarbers.includes(req.body.barberId)) {
      user.likedBarbers.push(req.body.barberId);
      await user.save();
    }
    res.json(user);
  } catch (e) { res.status(500).send('Server Error'); }
});

router.post('/unlike', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    user.likedBarbers = user.likedBarbers.filter(id => id.toString() !== req.body.barberId);
    await user.save();
    res.json(user);
  } catch (e) { res.status(500).send('Server Error'); }
});

router.get('/liked-barbers', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('likedBarbers');
    res.json(user.likedBarbers);
  } catch (e) { res.status(500).send('Server Error'); }
});

router.post('/likeSalon', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user.likedSalons.includes(req.body.salonId)) {
      user.likedSalons.push(req.body.salonId);
      await user.save();
    }
    res.json(user);
  } catch (e) { res.status(500).send('Server Error'); }
});

router.post('/unlikeSalon', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    user.likedSalons = user.likedSalons.filter(id => id.toString() !== req.body.salonId);
    await user.save();
    res.json(user);
  } catch (e) { res.status(500).send('Server Error'); }
});

router.post('/save-push-token', optionalAuth, async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Authentication required' });
    await User.findByIdAndUpdate(req.user.id, { expoPushToken: req.body.token });
    res.json({ msg: 'Saved' });
  } catch (e) { res.status(500).send('Server Error'); }
});

router.put('/availability', optionalAuth, async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Authentication required' });
    const user = await User.findByIdAndUpdate(req.user.id, { isAvailable: req.body.isAvailable }, { new: true });
    res.json({ msg: 'Updated', isAvailable: user.isAvailable });
  } catch (e) { res.status(500).send('Server Error'); }
});

// Admin Migration Tool
router.post('/migrate-email-hashes', auth, isAdmin, async (req, res) => {
  try {
    const { migrateExistingUsers } = require('../migrateEmailHashes');
    const result = await migrateExistingUsers();
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'Migration failed', error: error.message });
  }
});

/**
 * ============================================================================
 * 8. WHATSAPP OTP VERIFICATION (FOR CUSTOMERS)
 * ============================================================================
 */

// @route   POST api/auth/whatsapp/send-otp
router.post('/whatsapp/send-otp', whatsappLimiter, async (req, res) => {
  const { phone } = req.body;
  if (!phone) return res.status(400).json({ error: 'Phone number is required' });

  // 1. Indian Phone Number Validation (Standard 10 digits, optionally with +91)
  const phoneRegex = /^(\+91)?[6-9]\d{9}$/;
  if (!phoneRegex.test(phone)) {
    return res.status(400).json({ error: 'Please enter a valid 10-digit Indian mobile number.' });
  }

  // 2. Normalize and check if already registered
  const normalizedPhone = normalizePhone(phone);
  const phoneHash = createHMAC(normalizedPhone);

  try {
    const existingUser = await User.findOne({ phoneHash });
    if (existingUser) {
      return res.status(400).json({ 
        error: 'This phone number is already registered with an account. Please log in instead.' 
      });
    }

    // 3. Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Store in cache for 5 minutes
    cache.put(`whatsapp_otp_${phone}`, otp, 5 * 60 * 1000);

    // Send via WhatsApp (Safety measures internal to service)
    const result = await whatsappService.sendSafeOTP(phone, otp);

    if (result.success) {
      res.json({ message: 'OTP sent successfully to WhatsApp' });
    } else {
      res.status(500).json({ error: result.error || 'Failed to send WhatsApp OTP' });
    }
  } catch (error) {
    console.error('WhatsApp OTP Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// @route   POST api/auth/whatsapp/verify-otp
router.post('/whatsapp/verify-otp', whatsappLimiter, async (req, res) => {
  const { phone, otp } = req.body;
  if (!phone || !otp) return res.status(400).json({ error: 'Phone and OTP are required' });

  const storedOtp = cache.get(`whatsapp_otp_${phone}`);

  if (storedOtp && storedOtp === otp.toString()) {
    // Verification successful - store in cache for 10 minutes to allow registration
    cache.put(`verified_phone_${phone}`, true, 10 * 60 * 1000);
    cache.del(`whatsapp_otp_${phone}`);
    res.json({ success: true, message: 'Phone verified successfully' });
  } else {
    res.status(400).json({ error: 'Invalid or expired OTP' });
  }
});

module.exports = router;