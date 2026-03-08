const express = require('express');
const router = express.Router();
const ServiceArea = require('../models/ServiceArea');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');

// @route   GET api/areas
// @desc    Get all service areas
// @access  Public
router.get('/', async (req, res) => {
    try {
        const areas = await ServiceArea.find({ isActive: true });
        res.json(areas);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/areas/check-location
// @desc    Find service areas by location
// @access  Public
router.get('/check-location', async (req, res) => {
    try {
        const { lat, lng } = req.query;
        if (!lat || !lng) {
            return res.status(400).json({ msg: 'Please provide lat and lng' });
        }

        const areas = await ServiceArea.find({
            polygon: {
                $geoIntersects: {
                    $geometry: {
                        type: "Point",
                        coordinates: [parseFloat(lng), parseFloat(lat)]
                    }
                }
            },
            isActive: true
        });

        res.json(areas);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/areas
// @desc    Create a new service area (Admin Only)
// @access  Private (Admin)
router.post('/', adminAuth, async (req, res) => {
    try {
        const { name, polygon, tierPricing } = req.body;

        let area = new ServiceArea({
            name,
            polygon,
            tierPricing
        });

        await area.save();
        res.json(area);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT api/areas/:id
// @desc    Update a service area (Admin Only)
// @access  Private (Admin)
router.put('/:id', adminAuth, async (req, res) => {
    try {
        const { name, polygon, tierPricing, isActive } = req.body;

        let area = await ServiceArea.findById(req.params.id);
        if (!area) return res.status(404).json({ msg: 'Area not found' });

        if (name) area.name = name;
        if (polygon) area.polygon = polygon;
        if (tierPricing) area.tierPricing = tierPricing;
        if (typeof isActive !== 'undefined') area.isActive = isActive;

        await area.save();
        res.json(area);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   DELETE api/areas/:id
// @desc    Delete a service area (Admin Only)
// @access  Private (Admin)
router.delete('/:id', adminAuth, async (req, res) => {
    try {
        let area = await ServiceArea.findById(req.params.id);
        if (!area) return res.status(404).json({ msg: 'Area not found' });

        await ServiceArea.findByIdAndDelete(req.params.id);
        res.json({ msg: 'Area removed' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
