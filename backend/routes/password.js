const express = require('express');
const router = express.Router();
const User = require('../models/User');
const nodemailer = require('nodemailer');
// 1. Import encryption helpers
const { createHMAC, decrypt } = require('../utils/EncryptionService');
const validate = require('../middleware/validate');
const schemas = require('../utils/validationSchemas');

// @route   POST api/password/forgot
// @desc    Forgot password
// @access  Public
router.post('/forgot', validate(schemas.forgotPassword), async (req, res) => {
  console.log('Forgot password request received:', req.body);
  const { email } = req.body;

  try {
    // 2. Lookup using Hash
    const emailHash = createHMAC(email);
    const user = await User.findOne({ emailHash });
    console.log('User found:', user ? user._id : 'No user');

    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000);

    // Set OTP and expiry on user
    user.resetPasswordOtp = otp;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

    await user.save();

    // Send email
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL,
        pass: process.env.PASSWORD,
      },
    });

    // 3. SAFE DECRYPTION: Ensure we send to a string, not an object
    const userEmail = decrypt(user.email);

    const mailOptions = {
      from: process.env.EMAIL,
      to: userEmail,
      subject: 'Password Reset OTP',
      text: `Your OTP for password reset is ${otp}`,
    };

    transporter.sendMail(mailOptions, (err, response) => {
      if (err) {
        console.error('There was an error: ', err);
        return res.status(500).json({ msg: 'Error sending email' });
      }
      res.status(200).json({ msg: 'OTP sent' });
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/password/verify
// @desc    Verify OTP
// @access  Public
router.post('/verify', validate(schemas.verifyOtp), async (req, res) => {
  const { email, otp } = req.body;

  try {
    const emailHash = createHMAC(email);
    const user = await User.findOne({
      emailHash,
      resetPasswordOtp: otp,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ msg: 'Invalid OTP' });
    }

    res.status(200).json({ msg: 'OTP verified' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/password/reset
// @desc    Reset password
// @access  Public
router.post('/reset', validate(schemas.resetPassword), async (req, res) => {
  const { email, otp, password } = req.body;

  try {
    const emailHash = createHMAC(email);
    const user = await User.findOne({
      emailHash,
      resetPasswordOtp: otp,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ msg: 'Invalid OTP' });
    }

    // 4. CRITICAL FIX: DO NOT Hash here. 
    // Just set the plain password. The User model's pre('save') hook 
    // will detect the change and hash it automatically.
    // If you hash it here, it gets hashed TWICE (Double Hash), and login fails.
    user.password = password;

    user.resetPasswordOtp = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    res.status(200).json({ msg: 'Password updated' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;