const express = require('express');
const router = express.Router();
const adminAuth = require('../middleware/adminAuth');
const GlobalSettings = require('../models/GlobalSettings');
const Admin = require('../models/Admin');
const speakeasy = require('speakeasy');

// @route   GET api/settings
// @desc    Get global settings (public)
// @access  Public
router.get('/', async (req, res) => {
    try {
        let settings = await GlobalSettings.findOne().populate('featuredShopIds');
        if (!settings) {
            // Create default settings if none exist
            settings = new GlobalSettings({
                basicAppointmentFee: 9,
                expressAppointmentFee: 19,
                featuredShopIds: []
            });
            await settings.save();
        }
        res.json(settings);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT api/settings
// @desc    Update global settings
// @access  Private (Admin)
router.put('/', adminAuth, async (req, res) => {
    try {
        const { basicAppointmentFee, expressAppointmentFee, featuredShopIds, password, twoFactorCode } = req.body;

        // 1. Validate Admin Credentials
        const admin = await Admin.findById(req.admin.id);
        if (!admin) {
            return res.status(404).json({ msg: 'Admin not found' });
        }

        // 2. Verify Password
        if (!password) {
            return res.status(400).json({ msg: 'Password required' });
        }
        const isMatch = await admin.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ msg: 'Invalid password' });
        }

        // 3. Verify 2FA (if enabled)
        if (admin.isTwoFactorEnabled) {
            if (!twoFactorCode) {
                return res.status(400).json({ msg: '2FA code required' });
            }

            const verified = speakeasy.totp.verify({
                secret: admin.twoFactorSecret,
                encoding: 'base32',
                token: twoFactorCode
            });

            if (!verified) {
                return res.status(401).json({ msg: 'Invalid 2FA token' });
            }
        }

        let settings = await GlobalSettings.findOne();
        if (!settings) {
            settings = new GlobalSettings();
        }

        if (basicAppointmentFee !== undefined) settings.basicAppointmentFee = basicAppointmentFee;
        if (expressAppointmentFee !== undefined) settings.expressAppointmentFee = expressAppointmentFee;
        
        if (featuredShopIds !== undefined) {
            if (!Array.isArray(featuredShopIds)) {
                return res.status(400).json({ msg: 'featuredShopIds must be an array' });
            }
            if (featuredShopIds.length > 3) {
                return res.status(400).json({ msg: 'Maximum 3 shops can be featured' });
            }
            settings.featuredShopIds = featuredShopIds;
        }

        await settings.save();
        
        // Return populated settings
        const updatedSettings = await GlobalSettings.findById(settings._id).populate('featuredShopIds');
        res.json(updatedSettings);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
