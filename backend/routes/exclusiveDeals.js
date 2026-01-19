const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const ExclusiveDeal = require('../models/ExclusiveDeal');
const validate = require('../middleware/validate');
const schemas = require('../utils/validationSchemas');

// @route   GET api/exclusive-deals
// @desc    Get all active exclusive deals
// @access  Public
router.get('/', async (req, res) => {
  try {
    // Mongoose will automatically run 'get: decrypt' on title/description
    // because we added { toJSON: { getters: true } } to the Model.
    const deals = await ExclusiveDeal.find({ isActive: true })
      .sort({ createdAt: -1 });

    res.json({ success: true, deals });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// @route   GET api/exclusive-deals/:id
// @desc    Get a specific exclusive deal
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const deal = await ExclusiveDeal.findById(req.params.id);

    if (!deal) {
      return res.status(404).json({ success: false, message: 'Deal not found.' });
    }

    res.json({ success: true, deal });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ success: false, message: 'Deal not found.' });
    }
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// @route   POST api/exclusive-deals
// @desc    Create a new exclusive deal (Admin only)
// @access  Private (Admin)
router.post('/', auth, validate(schemas.createDeal), async (req, res) => {
  try {
    const { title, description, image, discountPercentage, bonusCoins, minimumPurchase, validUntil } = req.body;

    // The 'set: encrypt' in the model handles encryption automatically here
    const newDeal = new ExclusiveDeal({
      title,
      description,
      image,
      discountPercentage: discountPercentage || 0,
      bonusCoins: bonusCoins || 0,
      minimumPurchase: minimumPurchase || 0,
      validUntil,
    });

    const deal = await newDeal.save();
    res.json({ success: true, deal });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// @route   PUT api/exclusive-deals/:id
// @desc    Update an exclusive deal (Admin only)
// @access  Private (Admin)
router.put('/:id', auth, validate(schemas.updateDeal), async (req, res) => {
  try {
    const { title, description, image, discountPercentage, bonusCoins, minimumPurchase, isActive, validUntil } = req.body;

    const deal = await ExclusiveDeal.findById(req.params.id);

    if (!deal) {
      return res.status(404).json({ success: false, message: 'Deal not found.' });
    }

    // Mongoose setters will re-encrypt these fields if they are updated
    if (title) deal.title = title;
    if (description) deal.description = description;
    if (image) deal.image = image;

    // Handle numbers/booleans
    if (discountPercentage !== undefined) deal.discountPercentage = discountPercentage;
    if (bonusCoins !== undefined) deal.bonusCoins = bonusCoins;
    if (minimumPurchase !== undefined) deal.minimumPurchase = minimumPurchase;
    if (isActive !== undefined) deal.isActive = isActive;
    if (validUntil) deal.validUntil = validUntil;

    deal.updatedAt = Date.now();

    await deal.save();
    res.json({ success: true, deal });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ success: false, message: 'Deal not found.' });
    }
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// @route   DELETE api/exclusive-deals/:id
// @desc    Delete an exclusive deal (Admin only)
// @access  Private (Admin)
router.delete('/:id', auth, async (req, res) => {
  try {
    // FIXED: deal.remove() is deprecated and causes crashes in Mongoose 6+
    // Use findByIdAndDelete instead
    const deal = await ExclusiveDeal.findByIdAndDelete(req.params.id);

    if (!deal) {
      return res.status(404).json({ success: false, message: 'Deal not found.' });
    }

    res.json({ success: true, message: 'Deal removed.' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ success: false, message: 'Deal not found.' });
    }
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

module.exports = router;