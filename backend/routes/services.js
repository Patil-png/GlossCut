const express = require('express');
const router = express.Router();
const Service = require('../models/Service');

// @route   GET api/services
// @desc    Get all active services (public)
// @access  Public
router.get('/', async (req, res) => {
    try {
        // Fetch only active services for public display
        const services = await Service.find({ isActive: true }).select('name category description');
        res.json(services);
    } catch (err) {
        console.error('Error fetching public services:', err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
