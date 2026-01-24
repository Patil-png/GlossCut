const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const adminAuth = require('../middleware/adminAuth');
// IMPORT ENCRYPTION HELPER FOR HASH GENERATION
const { createHMAC } = require('../utils/EncryptionService');
const validate = require('../middleware/validate');
const schemas = require('../utils/validationSchemas');

// @route   GET api/admin/auth/admin
// @desc    Get admin data
// @access  Private
router.get('/admin', adminAuth, async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin.id).select('-password');
    res.json(admin);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/admin/auth/login
// @desc    Auth admin & get token
// @access  Public
router.post('/login', validate(schemas.adminLogin), async (req, res) => {
  const { email, password } = req.body;

  try {
    console.log('Admin login attempt for email:', email);

    // UPDATED: Find by emailHash instead of plain email
    const emailHash = createHMAC(email);
    let admin = await Admin.findOne({ emailHash });

    if (!admin) {
      console.log('Admin not found for email:', email);
      return res.status(400).json({ msg: 'Invalid Credentials' });
    }

    console.log('Admin found:', admin.email, 'Role:', admin.role);

    if (!admin.isActive) {
      return res.status(400).json({ msg: 'Account is inactive' });
    }

    const isMatch = await admin.comparePassword(password);

    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid Credentials' });
    }

    // Update last login
    admin.lastLogin = new Date();
    await admin.save();

    // 2FA CHECK
    if (admin.isTwoFactorEnabled) {
      return res.json({
        requiresTwoFactor: true,
        adminId: admin._id
      });
    }

    const payload = {
      admin: {
        id: admin.id,
        role: admin.role // Useful to include role in token
      },
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET || 'secret',
      {
        expiresIn: 360000, // 100 hours
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

// @route   POST api/admin/auth/register
// @desc    Register a new admin (only superadmin can do this)
// @access  Private (admin)
router.post('/register', adminAuth, validate(schemas.adminRegister), async (req, res) => {
  const { name, email, password, role, permissions } = req.body;

  try {
    // Only superadmin can create admins
    // Note: We need to fetch the requestor to check their role securely
    const requestor = await Admin.findById(req.admin.id);
    if (!requestor || requestor.role !== 'superadmin') {
      return res.status(403).json({ msg: 'Not authorized' });
    }

    // UPDATED: Check for existing admin using emailHash
    const emailHash = createHMAC(email);
    let admin = await Admin.findOne({ emailHash });

    if (admin) {
      return res.status(400).json({ msg: 'Admin already exists' });
    }

    admin = new Admin({
      name,
      email,
      password,
      role: role || 'admin',
      permissions: permissions || [],
    });

    await admin.save(); // Model hook handles encryption and hashing automatically

    res.json({ msg: 'Admin created successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// ============================================================================
// 2FA Routes
// ============================================================================

const speakeasy = require('speakeasy');
const qrcode = require('qrcode');

// @route   POST api/admin/auth/enable-2fa
// @desc    Generate 2FA secret and return QR code URL
// @access  Private
router.post('/enable-2fa', adminAuth, async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin.id);
    if (!admin) return res.status(404).json({ msg: 'Admin not found' });

    if (admin.isTwoFactorEnabled) {
      return res.status(400).json({ msg: '2FA is already enabled' });
    }

    // Generate secret
    const secret = speakeasy.generateSecret({
      name: `GlossCut Admin (${decrypt(admin.email)})` // Decrypt email for label
    });

    // Encrypt secret before sending to client (temp storage on client side? No, better to store temp in DB or just use it immediately)
    // Actually, we need to save it to verify next step. But we shouldn't enable it yet.
    // Strategy: Save secret to DB but keep isTwoFactorEnabled = false until verified.

    admin.twoFactorSecret = secret.base32; // Will be encrypted by model setter
    await admin.save();

    // Generate QR
    qrcode.toDataURL(secret.otpauth_url, (err, data_url) => {
      if (err) throw err;
      // Return secret (for manual entry) and QR code
      res.json({
        secret: secret.base32,
        qrCode: data_url
      });
    });

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/admin/auth/verify-2fa-setup
// @desc    Verify OTP to enable 2FA
// @access  Private
router.post('/verify-2fa-setup', adminAuth, async (req, res) => {
  const { token } = req.body;
  try {
    const admin = await Admin.findById(req.admin.id);
    if (!admin) return res.status(404).json({ msg: 'Admin not found' });

    const secret = decrypt(admin.twoFactorSecret); // Decrypt stored secret

    const verified = speakeasy.totp.verify({
      secret: secret,
      encoding: 'base32',
      token: token
    });

    if (verified) {
      admin.isTwoFactorEnabled = true;
      await admin.save();
      res.json({ msg: '2FA Enabled Successfully' });
    } else {
      res.status(400).json({ msg: 'Invalid Token' });
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/admin/auth/verify-2fa-login
// @desc    Step 2 of Login: Verify OTP and issue JWT
// @access  Public (Partial Auth via userId)
router.post('/verify-2fa-login', async (req, res) => {
  const { adminId, token } = req.body; // adminId comes from Step 1 response
  try {
    const admin = await Admin.findById(adminId);
    if (!admin) return res.status(400).json({ msg: 'Invalid Request' });

    const secret = decrypt(admin.twoFactorSecret);

    const verified = speakeasy.totp.verify({
      secret: secret,
      encoding: 'base32',
      token: token
    });

    if (verified) {
      // Issue JWT
      const payload = {
        admin: {
          id: admin.id,
          role: admin.role
        },
      };

      jwt.sign(
        payload,
        process.env.JWT_SECRET || 'secret',
        { expiresIn: 360000 },
        (err, token) => {
          if (err) throw err;
          res.json({ token });
        }
      );
    } else {
      res.status(400).json({ msg: 'Invalid 2FA Token' });
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;