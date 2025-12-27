const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const adminAuth = require('../middleware/adminAuth');

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
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    let admin = await Admin.findOne({ email });

    if (!admin) {
      return res.status(400).json({ msg: 'Invalid Credentials' });
    }

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
router.post('/register', adminAuth, async (req, res) => {
  const { name, email, password, role, permissions } = req.body;

  try {
    // Only superadmin can create admins
    if (req.admin.role !== 'superadmin') {
      return res.status(403).json({ msg: 'Not authorized' });
    }

    let admin = await Admin.findOne({ email });
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

    await admin.save();

    res.json({ msg: 'Admin created successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
