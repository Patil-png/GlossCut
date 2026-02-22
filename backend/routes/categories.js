const express = require('express');
const router = express.Router();
const ServiceCategory = require('../models/ServiceCategory');

// @route   GET api/categories
// @desc    Get all active service categories
// @access  Public (Used by PWA and Customer App)
router.get('/', async (req, res) => {
    try {
        const { shopId } = req.query;
        let query = { isActive: true };

        if (shopId) {
            query.$or = [{ shopId: null }, { shopId }];
        } else {
            query.shopId = null; // Only global by default if no shopId provided
        }

        const categories = await ServiceCategory.find(query).sort({ name: 1 });
        res.json(categories);
    } catch (err) {
        console.error('Error fetching categories:', err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
