const express = require('express');
const router = express.Router();
const ServiceCategory = require('../models/ServiceCategory');

// @route   GET api/categories
// @desc    Get all active service categories
// @access  Public (Used by PWA and Customer App)
router.get('/', async (req, res) => {
    try {
        const categories = await ServiceCategory.find({ isActive: true }).sort({ name: 1 });
        res.json(categories);
    } catch (err) {
        console.error('Error fetching categories:', err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
