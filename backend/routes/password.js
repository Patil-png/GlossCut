const express = require('express');
const router = express.Router();
const User = require('../models/User');
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
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

    const logoPath = path.join(__dirname, '../../customer-app/assets/GlossCut.png');
    let logoSrc = '';
    try {
      const base64Logo = fs.readFileSync(logoPath, { encoding: 'base64' });
      logoSrc = `data:image/png;base64,${base64Logo}`;
    } catch (e) {
      console.error('Error reading logo file:', e.message);
    }

    const mailOptions = {
      from: process.env.EMAIL,
      to: userEmail,
      subject: 'Password Reset OTP',
      text: `Your OTP for password reset is ${otp}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            @media only screen and (max-width: 480px) {
              .card {
                padding: 20px !important;
                border-radius: 20px !important;
              }
              .header-text {
                font-size: 32px !important;
              }
              .outer-container {
                padding: 30px 10px !important;
              }
            }
          </style>
        </head>
        <body style="margin: 0; padding: 0;">
          <div class="outer-container" style="background-color: #FCEBD8; padding: 60px 20px; font-family: 'Arial', sans-serif; text-align: center;">
            <div class="card" style="max-width: 450px; width: 100%; margin: 0 auto; background-color: #FFFFFF; border-radius: 32px; padding: 40px; box-shadow: 0 10px 25px rgba(0,0,0,0.05); text-align: center; position: relative; box-sizing: border-box;">
            
            <!-- Close Button (Visual Only) -->
            <div style="position: absolute; top: 20px; right: 20px; width: 30px; height: 30px; background-color: #E2E8F0; border-radius: 15px; line-height: 30px; color: #718096; font-size: 16px; font-weight: bold; cursor: pointer;">✕</div>
            
            <!-- Rocket Illustration -->
            <div style="margin-bottom: 20px; font-size: 80px;">
              🚀
            </div>
            
            <!-- Header -->
            <h1 class="header-text" style="font-size: 38px; font-weight: 900; color: #000000; margin: 0 0 10px 0; font-family: 'Arial Black', sans-serif; letter-spacing: -1px;">HEY YOU!</h1>
            
            <!-- Subtitle -->
            <p style="font-size: 15px; color: #000000; font-weight: 700; margin: 0 0 30px 0; line-height: 1.4; padding: 0 20px;">
              Use the security code below to reset your account password.
            </p>
            
            <!-- OTP Box (Styled like the black button) -->
            <div style="background-color: #000000; color: #FFFFFF; border-radius: 12px; padding: 16px; width: 100%; max-width: 320px; margin: 0 auto 10px auto; box-sizing: border-box;">
              <p style="margin: 0; font-size: 24px; font-weight: 900; letter-spacing: 6px; user-select: all; -webkit-user-select: all;">${otp}</p>
            </div>
            <p style="font-size: 11px; color: #718096; font-weight: 700; margin: 0 0 20px 0;">💡 Tap the code to auto-select and copy</p>

            <!-- Informative Content Section -->
            <div style="text-align: left; margin-top: 30px; padding: 20px; background-color: #F8FAFC; border-radius: 12px; margin-bottom: 20px;">
              <h3 style="font-size: 14px; font-weight: 700; color: #1E293B; margin: 0 0 8px 0; text-transform: uppercase; letter-spacing: 0.5px;">🔒 Security Information</h3>
              <p style="font-size: 13px; color: #64748B; margin: 0 0 15px 0; line-height: 1.5;">
                This code is valid for 1 hour. Glosscut employees will never call or message you to ask for this code. If you did not request a password reset, please secure your account immediately or ignore this email.
              </p>
              
              <h3 style="font-size: 14px; font-weight: 700; color: #1E293B; margin: 15px 0 8px 0; text-transform: uppercase; letter-spacing: 0.5px;">✨ About Glosscut</h3>
              <p style="font-size: 13px; color: #64748B; margin: 0; line-height: 1.5;">
                Glosscut is your premium salon discovery platform. We provide you with the best information, reviews, and services of top salons in your area to help you find your perfect style.
              </p>
            </div>
            
            <!-- Footer Link -->
            <p style="font-size: 12px; color: #94A3B8; font-weight: 700; margin: 0;">Code expires in 15 minutes.</p>
            
          </div>
          
          <!-- Brand Logo at the bottom -->
          <div style="margin-top: 30px; display: inline-block;">
            <div style="display: flex; align-items: center; justify-content: center; gap: 10px;">
              ${logoSrc ? `<img src="${logoSrc}" style="height: 32px; width: auto;" alt="Logo" />` : `<div style="width: 32px; height: 32px; background-color: #3B82F6; border-radius: 16px; line-height: 32px; color: #FFFFFF; font-weight: bold; font-size: 18px;">G</div>`}
              <span style="font-size: 20px; font-weight: 900; color: #000000;">Glosscut</span>
            </div>
          </div>
        </div>
      `,
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
      resetPasswordOtp: Number(otp),
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
      resetPasswordOtp: Number(otp),
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