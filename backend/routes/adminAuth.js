const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const adminAuth = require('../middleware/adminAuth');
// IMPORT ENCRYPTION HELPER FOR HASH GENERATION
const { createHMAC, decrypt } = require('../utils/EncryptionService');
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

    // LEVEL 5: Emergency Lock Check
    if (admin.isEmergencyLocked) {
      return res.status(403).json({ msg: 'ACCOUNT SECURED: Access suspended due to emergency lock. Contact system owner.' });
    }

    const isMatch = await admin.comparePassword(password);

    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid Credentials' });
    }

    // LEVEL 2: Device Bound Layer
    const deviceId = req.header('X-Device-Id');
    const deviceModel = req.header('X-Device-Model');

    if (admin.approvedDevices && admin.approvedDevices.length > 0) {
      const isDeviceApproved = admin.approvedDevices.some(d => d.deviceId === deviceId);

      if (!isDeviceApproved) {
        // If they have less than 2 devices, allow auto-registration (for co-founders setup)
        if (admin.approvedDevices.length < 2) {
          admin.approvedDevices.push({
            deviceId,
            deviceModel: deviceModel || 'Unknown Device',
            os: req.header('X-Device-OS') || 'Unknown'
          });
          await admin.save();
        } else {
          return res.status(403).json({
            msg: 'DEVICE BLOCKED: This device is not authorized for administrative access.',
            unauthorizedDevice: true
          });
        }
      }
    } else {
      // First time setup: Register this device as primary
      admin.approvedDevices = [{
        deviceId,
        deviceModel: deviceModel || 'Primary Device',
        os: req.header('X-Device-OS') || 'Unknown'
      }];
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
    console.log('2FA Enable Request for Admin ID:', req.admin.id);
    const admin = await Admin.findById(req.admin.id);
    if (!admin) {
      console.log('Admin not found in DB');
      return res.status(404).json({ msg: 'Admin not found' });
    }

    if (admin.isTwoFactorEnabled) {
      return res.status(400).json({ msg: '2FA is already enabled' });
    }

    // SAFE DECRYPTION
    let emailLabel = 'Unknown';
    try {
      emailLabel = decrypt(admin.email);
    } catch (e) {
      console.error('Decryption failed for admin email:', e);
      // Fallback if decryption fails (e.g. legacy data)
      emailLabel = 'Admin';
    }

    // Generate secret
    console.log('Generating Speakeasy Secret...');
    const secret = speakeasy.generateSecret({
      name: `GlossCut Admin (${emailLabel})`
    });

    console.log('Secret generated. Saving to DB...');
    admin.twoFactorSecret = secret.base32; // Will be encrypted by model setter
    await admin.save();
    console.log('Secret saved.');

    // Generate QR
    qrcode.toDataURL(secret.otpauth_url, (err, data_url) => {
      if (err) {
        console.error('QR Code Generation Error:', err);
        throw err;
      }
      res.json({
        secret: secret.base32,
        qrCode: data_url
      });
    });

  } catch (err) {
    console.error('2FA Enable Logic Error:', err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/admin/auth/verify-2fa-setup
// @desc    Verify OTP to enable 2FA
// @access  Private
router.post('/verify-2fa-setup', adminAuth, async (req, res) => {
  const { token } = req.body;
  try {
    console.log('Verifying 2FA Setup for Admin:', req.admin.id);
    const admin = await Admin.findById(req.admin.id);
    if (!admin) return res.status(404).json({ msg: 'Admin not found' });

    // FIX: Model getter already decrypts this. Do not decrypt again.
    const secret = admin.twoFactorSecret;

    if (!secret) {
      console.error('No secret found for admin');
      return res.status(400).json({ msg: '2FA not initialized' });
    }

    const verified = speakeasy.totp.verify({
      secret: secret,
      encoding: 'base32',
      token: token
    });

    if (verified) {
      admin.isTwoFactorEnabled = true;
      await admin.save();
      console.log('2FA Setup Verified & Enabled');
      res.json({ msg: '2FA Enabled Successfully' });
    } else {
      console.warn('Invalid Token provided for 2FA Setup');
      res.status(400).json({ msg: 'Invalid Token' });
    }
  } catch (err) {
    console.error('2FA Verify Setup Error:', err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/admin/auth/verify-2fa-login
// @desc    Step 2 of Login: Verify OTP and issue JWT
// @access  Public (Partial Auth via userId)
router.post('/verify-2fa-login', async (req, res) => {
  const { adminId, token } = req.body; // adminId comes from Step 1 response
  try {
    console.log('Verifying 2FA Login for Admin ID:', adminId);
    const admin = await Admin.findById(adminId);
    if (!admin) return res.status(400).json({ msg: 'Invalid Request' });

    // FIX: Model getter already decrypts this. Do not decrypt again.
    const secret = admin.twoFactorSecret;

    if (!secret) {
      // Should not happen if isTwoFactorEnabled is true
      return res.status(400).json({ msg: '2FA Not Configured' });
    }

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
      console.warn('Invalid 2FA Token for Login');
      res.status(400).json({ msg: 'Invalid 2FA Token' });
    }
  } catch (err) {
    console.error('2FA Verify Login Error:', err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;