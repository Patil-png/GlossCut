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

module.exports = router;