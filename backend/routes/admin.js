const express = require('express');
const router = express.Router();
const adminAuth = require('../middleware/adminAuth');
const Admin = require('../models/Admin');
const User = require('../models/User');
const Booking = require('../models/Booking');
const Review = require('../models/Review');
const Shop = require('../models/Shop');
const BarberCard = require('../models/BarberCard');
const BarberCardDeleteRequest = require('../models/BarberCardDeleteRequest');
const AdPlacement = require('../models/AdPlacement');
const ExclusiveDeal = require('../models/ExclusiveDeal');
const Service = require('../models/Service');
const ServiceCategory = require('../models/ServiceCategory');
const SubscriptionPlan = require('../models/SubscriptionPlan');
const bcrypt = require('bcryptjs');
const { decrypt } = require('../utils/EncryptionService');

// Ultra-efficient in-memory cache for admin operations
const adminCache = new Map();
const ADMIN_CACHE_DURATION = 10 * 60 * 1000; // 10 minutes for admin data

// Cache management functions
const getAdminCached = (key) => {
  const cached = adminCache.get(key);
  if (cached && Date.now() - cached.timestamp < ADMIN_CACHE_DURATION) {
    return cached.data;
  }
  adminCache.delete(key);
  return null;
};

const setAdminCached = (key, data) => {
  adminCache.set(key, { data, timestamp: Date.now() });
  // Prevent memory leaks - limit cache size
  if (adminCache.size > 50) {
    const firstKey = adminCache.keys().next().value;
    adminCache.delete(firstKey);
  }
};

// @route   GET api/admin/users
// @desc    Get all users
// @access  Private (Admin)
router.get('/users', adminAuth, async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/admin/bookings
// @desc    Get all bookings
// @access  Private (Admin)
router.get('/bookings', adminAuth, async (req, res) => {
  try {
    const bookings = await Booking.find().populate('userId barberId');
    res.json(bookings);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/admin/bookings-by-date/:date
// @desc    Get bookings for a specific date grouped by barber
// @access  Private (Admin)
router.get('/bookings-by-date/:date', adminAuth, async (req, res) => {
  try {
    const { date } = req.params;

    // Parse the date and create date range for the day
    const selectedDate = new Date(date);
    const startOfDay = new Date(selectedDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(selectedDate);
    endOfDay.setHours(23, 59, 59, 999);

    const bookings = await Booking.find({
      date: { $gte: startOfDay, $lte: endOfDay }
    }).populate('userId barberId').sort({ time: 1 });

    // Group bookings by barber
    const bookingsByBarber = {};
    bookings.forEach(booking => {
      const barberId = booking.barberId?._id || 'unknown';
      const barberName = booking.barberId?.name || 'Unknown Barber';

      if (!bookingsByBarber[barberId]) {
        bookingsByBarber[barberId] = {
          barberId,
          barberName,
          bookings: []
        };
      }

      bookingsByBarber[barberId].bookings.push(booking);
    });

    res.json(Object.values(bookingsByBarber));
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/admin/reviews
// @desc    Get all reviews
// @access  Private (Admin)
router.get('/reviews', adminAuth, async (req, res) => {
  try {
    const reviews = await Review.find().populate('userId barberId');
    res.json(reviews);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/admin/barber-reviews
// @desc    Get reviews grouped by barber with overall statistics
// @access  Private (Admin)
router.get('/barber-reviews', adminAuth, async (req, res) => {
  try {
    const reviews = await Review.find().populate('userId barberId');

    // Group reviews by barber
    const reviewsByBarber = {};
    reviews.forEach(review => {
      const barberId = review.barberId?._id || 'unknown';
      const barberName = review.barberId?.name || 'Unknown Barber';

      if (!reviewsByBarber[barberId]) {
        reviewsByBarber[barberId] = {
          barberId,
          barberName,
          reviews: [],
          totalReviews: 0,
          averageRating: 0,
          ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
        };
      }

      reviewsByBarber[barberId].reviews.push(review);
      reviewsByBarber[barberId].ratingDistribution[review.rating]++;
    });

    // Calculate statistics for each barber
    Object.keys(reviewsByBarber).forEach(barberId => {
      const barberData = reviewsByBarber[barberId];
      barberData.totalReviews = barberData.reviews.length;
      barberData.averageRating = barberData.totalReviews > 0
        ? (barberData.reviews.reduce((sum, review) => sum + review.rating, 0) / barberData.totalReviews).toFixed(1)
        : 0;
    });

    res.json(Object.values(reviewsByBarber));
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/admin/shops
// @desc    Get all shops
// @access  Private (Admin)
router.get('/shops', adminAuth, async (req, res) => {
  try {
    const shops = await Shop.find().populate('owner staff');
    res.json(shops);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/admin/ads
// @desc    Get all ads
// @access  Private (Admin)
router.get('/ads', adminAuth, async (req, res) => {
  try {
    const ads = await AdPlacement.find().populate('barberId', 'name email profilePicture');
    res.json(ads);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/admin/ads/:id/status
// @desc    Update ad status
// @access  Private (Admin)
router.put('/ads/:id/status', adminAuth, async (req, res) => {
  try {
    const { status } = req.body;

    if (!['pending', 'active', 'expired', 'booked'].includes(status)) {
      return res.status(400).json({ msg: 'Invalid status' });
    }

    const ad = await AdPlacement.findById(req.params.id);
    if (!ad) {
      return res.status(404).json({ msg: 'Ad not found' });
    }

    ad.status = status;
    if (status === 'active') {
      ad.isBooked = true;
      ad.bookedAt = new Date();
    }

    await ad.save();
    res.json(ad);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   DELETE api/admin/ads/:id
// @desc    Delete ad
// @access  Private (Admin)
router.delete('/ads/:id', adminAuth, async (req, res) => {
  try {
    const ad = await AdPlacement.findById(req.params.id);
    if (!ad) {
      return res.status(404).json({ msg: 'Ad not found' });
    }

    await AdPlacement.findByIdAndDelete(req.params.id);
    res.json({ msg: 'Ad deleted successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/admin/listing-tiers
// @desc    Get all listing tier purchases
// @access  Private (Admin)
router.get('/listing-tiers', adminAuth, async (req, res) => {
  try {
    const ListingPlace = require('../models/ListingPlace');
    const listingTiers = await ListingPlace.find()
      .populate('lockedBy', 'name email profilePicture')
      .sort({ createdAt: -1 });

    // Get tier pricing information
    const tierPricing = {
      1: { name: 'Premium', price: 999, place: '1st' },
      2: { name: 'Gold', price: 899, place: '2nd' },
      3: { name: 'Silver', price: 799, place: '3rd' },
      4: { name: 'Bronze', price: 699, place: '4th' },
      5: { name: 'Standard', price: 599, place: '5th' },
      6: { name: 'Basic', price: 499, place: '6th' },
      7: { name: 'Entry', price: 399, place: '7th' },
      8: { name: 'Starter', price: 299, place: '8th' },
      9: { name: 'Lite', price: 199, place: '9th' },
      10: { name: 'Free', price: 99, place: '10th' }
    };

    const listingTiersWithDetails = listingTiers.map(tier => {
      const tierObj = tier.toObject();
      return {
        ...tierObj,
        createdAt: tierObj.lockedAt, // Map lockedAt to createdAt for frontend compatibility
        tierDetails: tierPricing[tier.tierId] || { name: 'Unknown', price: 0, place: 'Unknown' }
      };
    });

    res.json(listingTiersWithDetails);
  } catch (err) {
    console.error('Error fetching listing tiers:', err);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/admin/deals
// @desc    Get all deals
// @access  Private (Admin)
router.get('/deals', adminAuth, async (req, res) => {
  try {
    const deals = await ExclusiveDeal.find().sort({ createdAt: -1 });
    res.json(deals);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/admin/deals
// @desc    Create a new deal
// @access  Private (Admin)
router.post('/deals', adminAuth, async (req, res) => {
  try {
    const { title, description, discountPercentage, bonusCoins, minimumPurchase, validUntil, image } = req.body;

    const deal = new ExclusiveDeal({
      title,
      description,
      discountPercentage: discountPercentage || 0,
      bonusCoins: bonusCoins || 0,
      minimumPurchase: minimumPurchase || 0,
      validUntil,
      image
    });

    await deal.save();
    res.json(deal);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/admin/deals/:id
// @desc    Update a deal
// @access  Private (Admin)
router.put('/deals/:id', adminAuth, async (req, res) => {
  try {
    const { title, description, discountPercentage, bonusCoins, minimumPurchase, validUntil, image, isActive } = req.body;

    const deal = await ExclusiveDeal.findById(req.params.id);
    if (!deal) {
      return res.status(404).json({ msg: 'Deal not found' });
    }

    if (title) deal.title = title;
    if (description) deal.description = description;
    if (discountPercentage !== undefined) deal.discountPercentage = discountPercentage;
    if (bonusCoins !== undefined) deal.bonusCoins = bonusCoins;
    if (minimumPurchase !== undefined) deal.minimumPurchase = minimumPurchase;
    if (validUntil) deal.validUntil = validUntil;
    if (image) deal.image = image;
    if (isActive !== undefined) deal.isActive = isActive;

    deal.updatedAt = new Date();
    await deal.save();

    res.json(deal);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   DELETE api/admin/deals/:id
// @desc    Delete a deal
// @access  Private (Admin)
router.delete('/deals/:id', adminAuth, async (req, res) => {
  try {
    const deal = await ExclusiveDeal.findById(req.params.id);
    if (!deal) {
      return res.status(404).json({ msg: 'Deal not found' });
    }

    await ExclusiveDeal.findByIdAndDelete(req.params.id);
    res.json({ msg: 'Deal deleted successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/admin/cards
// @desc    Get all pending cards for approval (NO CACHING for real-time admin updates)
// @access  Private (Admin)
router.get('/cards', adminAuth, async (req, res) => {
  try {
    console.log('🔍 Admin fetching pending cards...');

    // Force fresh data - no caching for admin approval workflow
    // Fetch cards that are 'pending' OR have pending changes waiting
    const pendingBarberCards = await BarberCard.find({
      $or: [
        { approvalStatus: { $in: ['pending', 'pending_admin_approval'] } },
        { 'changeDetails.0': { $exists: true } } // Check if changeDetails array is not empty
      ]
    })
      .populate('barberId', 'name email phone profilePicture')
      .populate('shopId', 'name address phone owner staff image')
      .sort({ updatedAt: -1 });

    const pendingShops = await Shop.find({
      $or: [
        { approvalStatus: 'pending' },
        { 'changeDetails.0': { $exists: true } }
      ]
    })
      .populate('owner', 'name email')
      .sort({ updatedAt: -1 });

    // Add change details to the response
    const barberCardsWithDetails = pendingBarberCards.map(card => ({
      ...card.toObject(),
      changeDetails: card.changeDetails || [],
      pendingChanges: card.pendingChanges || {},
      originalData: card.originalData || {},
      hasChanges: !!(card.changeDetails && card.changeDetails.length > 0),
      lastUpdated: card.updatedAt
    }));

    const shopsWithDetails = pendingShops.map(shop => ({
      ...shop.toObject(),
      changeDetails: shop.changeDetails || [],
      pendingChanges: shop.pendingChanges || {},
      originalData: shop.originalData || {},
      hasChanges: !!(shop.changeDetails && shop.changeDetails.length > 0),
      lastUpdated: shop.updatedAt
    }));

    // Prevent any caching of admin approval data
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });

    res.json({
      barberCards: barberCardsWithDetails,
      shops: shopsWithDetails,
      totalPending: barberCardsWithDetails.length + shopsWithDetails.length,
      lastRefresh: new Date().toISOString()
    });
  } catch (err) {
    console.error('Admin cards fetch error:', err);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/admin/cards/barber/:id/approve
// @desc    Approve a barber card
// @access  Private (Admin)
router.put('/cards/barber/:id/approve', adminAuth, async (req, res) => {
  try {
    const barberCard = await BarberCard.findById(req.params.id);

    if (!barberCard) {
      return res.status(404).json({ msg: 'Barber card not found' });
    }

    console.log(`Approving barber card ${barberCard._id} - changing status from ${barberCard.approvalStatus} to approved`);

    // Merge pending changes into main data when approving
    if (barberCard.pendingChanges) {
      console.log('🔄 Merging pending changes into approved data...');

      if (barberCard.pendingChanges.name) {
        barberCard.name = barberCard.pendingChanges.name;
      }
      if (barberCard.pendingChanges.services) {
        barberCard.services = barberCard.pendingChanges.services;
      }
      if (barberCard.pendingChanges.specialties) {
        barberCard.specialties = barberCard.pendingChanges.specialties;
      }
      if (barberCard.pendingChanges.avgAppointmentTime) {
        barberCard.avgAppointmentTime = barberCard.pendingChanges.avgAppointmentTime;
      }
      if (barberCard.pendingChanges.isAvailable !== undefined) {
        barberCard.isAvailable = barberCard.pendingChanges.isAvailable;
      }
      if (barberCard.pendingChanges.image) {
        barberCard.image = barberCard.pendingChanges.image;
      }

      // Clear pending changes and change details after approval
      barberCard.pendingChanges = {};
      barberCard.changeDetails = [];
      barberCard.originalData = {};

      console.log('✅ Pending changes merged successfully');
    }

    barberCard.approvalStatus = 'approved';
    barberCard.approvalDate = new Date();
    await barberCard.save();

    res.json({ msg: 'Barber card approved successfully', barberCard });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/admin/cards/barber/:id/reject
// @desc    Reject a barber card
// @access  Private (Admin)
router.put('/cards/barber/:id/reject', adminAuth, async (req, res) => {
  try {
    const { rejectionReason } = req.body;

    const barberCard = await BarberCard.findById(req.params.id);

    if (!barberCard) {
      return res.status(404).json({ msg: 'Barber card not found' });
    }

    barberCard.approvalStatus = 'rejected';
    barberCard.rejectionReason = rejectionReason;
    await barberCard.save();

    res.json({ msg: 'Barber card rejected', barberCard });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/admin/cards/shop/:id/approve
// @desc    Approve a shop
// @access  Private (Admin)
router.put('/cards/shop/:id/approve', adminAuth, async (req, res) => {
  try {
    const shop = await Shop.findById(req.params.id);

    if (!shop) {
      return res.status(404).json({ msg: 'Shop not found' });
    }

    shop.approvalStatus = 'approved';
    shop.approvalDate = new Date();

    // MERGE PENDING CHANGES (Fix for persistent pending state)
    if (shop.pendingChanges) {
      console.log(`🔄 Merging pending changes for shop ${shop._id}...`);

      // List of fields allowed to be updated
      const fields = ['name', 'address', 'phone', 'services', 'tag', 'location', 'avgAppointmentTime', 'isAvailable', 'image', 'upiId', 'operatingHours', 'category'];

      fields.forEach(field => {
        if (shop.pendingChanges[field] !== undefined) {
          shop[field] = shop.pendingChanges[field];
        }
      });

      // Clear pending trackers
      shop.pendingChanges = {};
      shop.changeDetails = [];
      shop.originalData = {};

      console.log('✅ Pending changes merged and cleared');
    }

    // Fix for "Can't extract geo keys" error
    if (shop.location && (!shop.location.coordinates || shop.location.coordinates.length < 2)) {
      console.log(`Fixing invalid location for shop ${shop._id}`);
      shop.location = {
        type: 'Point',
        coordinates: [0, 0] // Default to 0,0 if missing
      };
    }

    await shop.save();

    res.json({ msg: 'Shop approved and updated successfully', shop });
  } catch (err) {
    console.error('Approve Shop Error:', err);
    res.status(500).json({ msg: 'Server Error', error: err.message, stack: err.stack });
  }
});

// @route   PUT api/admin/cards/shop/:id/reject
// @desc    Reject a shop
// @access  Private (Admin)
router.put('/cards/shop/:id/reject', adminAuth, async (req, res) => {
  try {
    const { rejectionReason } = req.body;

    const shop = await Shop.findById(req.params.id);

    if (!shop) {
      return res.status(404).json({ msg: 'Shop not found' });
    }

    shop.approvalStatus = 'rejected';
    shop.rejectionReason = rejectionReason;
    await shop.save();

    res.json({ msg: 'Shop rejected', shop });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/admin/delete-requests
// @desc    Get all pending barber card delete requests
// @access  Private (Admin)
router.get('/delete-requests', adminAuth, async (req, res) => {
  try {
    const deleteRequests = await BarberCardDeleteRequest.find({ status: 'pending' })
      .populate('barberCardId', 'name services specialties')
      .populate('barberId', 'name email')
      .populate('shopId', 'name address')
      .sort({ requestedAt: -1 });

    res.json(deleteRequests);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/admin/delete-requests/:id/approve
// @desc    Approve a barber card delete request
// @access  Private (Admin)
router.put('/delete-requests/:id/approve', adminAuth, async (req, res) => {
  try {
    const deleteRequest = await BarberCardDeleteRequest.findById(req.params.id);

    if (!deleteRequest) {
      return res.status(404).json({ msg: 'Delete request not found' });
    }

    if (deleteRequest.status !== 'pending') {
      return res.status(400).json({ msg: 'Request has already been processed' });
    }

    // Find the barber card to get the barberId (User ID) before deletion
    const barberCard = await BarberCard.findById(deleteRequest.barberCardId);

    if (barberCard) {
      // Cleanup: Remove this barber from the associated shop's staff list
      // (Safe to do even if it's the owner, as $pull matches value)
      if (barberCard.shopId) {
        await Shop.findByIdAndUpdate(barberCard.shopId, {
          $pull: { staff: barberCard.barberId }
        });
      }

      // Delete the barber card
      await BarberCard.findByIdAndDelete(deleteRequest.barberCardId);
    } else {
      console.log("Barber card not found during approval (might differ from request ID already deleted?)");
    }

    // Update the delete request
    deleteRequest.status = 'approved';
    deleteRequest.processedAt = new Date();
    deleteRequest.processedBy = req.admin._id;
    await deleteRequest.save();

    res.json({ msg: 'Barber card delete request approved and card deleted successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/admin/delete-requests/:id/reject
// @desc    Reject a barber card delete request
// @access  Private (Admin)
router.put('/delete-requests/:id/reject', adminAuth, async (req, res) => {
  try {
    const { rejectionReason } = req.body;

    const deleteRequest = await BarberCardDeleteRequest.findById(req.params.id);

    if (!deleteRequest) {
      return res.status(404).json({ msg: 'Delete request not found' });
    }

    if (deleteRequest.status !== 'pending') {
      return res.status(400).json({ msg: 'Request has already been processed' });
    }

    // Update the delete request
    deleteRequest.status = 'rejected';
    deleteRequest.processedAt = new Date();
    deleteRequest.processedBy = req.admin._id;
    deleteRequest.rejectionReason = rejectionReason || 'Request rejected by admin';
    await deleteRequest.save();

    res.json({ msg: 'Barber card delete request rejected' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/admin/services
// @desc    Get all services (supports shopId filtering)
// @access  Private (Admin)
router.get('/services', adminAuth, async (req, res) => {
  try {
    const { shopId } = req.query;
    let query = {};

    if (shopId === 'master') {
      query.shopId = null;
    } else if (shopId) {
      // Return services for this specific shop OR master services (shopId: null)
      query.$or = [{ shopId: shopId }, { shopId: null }];
    }

    // Populate shop name and address if useful
    const services = await Service.find(query).populate('shopId').sort({ createdAt: -1 });
    res.json(services);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/admin/services/assign
// @desc    Assign a master service to a specific shop (clones it)
// @access  Private (Admin)
router.post('/services/assign', adminAuth, async (req, res) => {
  try {
    const { serviceId, shopId } = req.body;

    if (!serviceId || !shopId) {
      return res.status(400).json({ msg: 'Please provide serviceId and shopId' });
    }

    const masterService = await Service.findById(serviceId);
    if (!masterService) {
      return res.status(404).json({ msg: 'Master service not found' });
    }

    // Check if a service with the same name already exists in this shop
    const existingService = await Service.findOne({
      name: masterService.name, // The model handles encryption/decryption automagically via getters/setters
      shopId: shopId
    });

    if (existingService) {
      return res.status(400).json({ msg: 'This service is already assigned to this shop' });
    }

    const newService = new Service({
      name: masterService.name,
      description: masterService.description,
      category: masterService.category,
      shopId: shopId,
      isActive: true
    });

    await newService.save();
    res.json(newService);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/admin/services
// @desc    Create a new service
// @access  Private (Admin)
router.post('/services', adminAuth, async (req, res) => {
  try {
    const { name, description, category, shopId } = req.body;

    const service = new Service({
      name,
      description,
      category: category || 'General',
      shopId: shopId || null
    });

    await service.save();
    res.json(service);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ msg: 'Service name already exists' });
    }
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/admin/services/:id
// @desc    Update a service
// @access  Private (Admin)
router.put('/services/:id', adminAuth, async (req, res) => {
  try {
    const { name, description, category, isActive, shopId } = req.body;

    const service = await Service.findById(req.params.id);
    if (!service) {
      return res.status(404).json({ msg: 'Service not found' });
    }

    if (name) service.name = name;
    if (description) service.description = description;
    if (category) service.category = category;
    if (isActive !== undefined) service.isActive = isActive;
    if (shopId !== undefined) service.shopId = shopId;

    service.updatedAt = new Date();
    await service.save();

    res.json(service);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ msg: 'Service name already exists' });
    }
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   DELETE api/admin/services/:id
// @desc    Delete a service
// @access  Private (Admin)
router.delete('/services/:id', adminAuth, async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) {
      return res.status(404).json({ msg: 'Service not found' });
    }

    await Service.findByIdAndDelete(req.params.id);
    res.json({ msg: 'Service deleted successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/admin/categories
// @desc    Get all categories
// @access  Private (Admin)
router.get('/categories', adminAuth, async (req, res) => {
  try {
    const categories = await ServiceCategory.find().sort({ name: 1 });
    res.json(categories);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/admin/categories
// @desc    Create a new category
// @access  Private (Admin)
router.post('/categories', adminAuth, async (req, res) => {
  try {
    const { name, emoji, color, gender } = req.body;

    const category = new ServiceCategory({
      name,
      emoji,
      color,
      gender: gender || 'unisex'
    });

    await category.save();
    res.json(category);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/admin/categories/:id
// @desc    Update a category
// @access  Private (Admin)
router.put('/categories/:id', adminAuth, async (req, res) => {
  try {
    const { name, emoji, color, gender, isActive } = req.body;

    const category = await ServiceCategory.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ msg: 'Category not found' });
    }

    if (name) category.name = name;
    if (emoji) category.emoji = emoji;
    if (color) category.color = color;
    if (gender) category.gender = gender;
    if (isActive !== undefined) category.isActive = isActive;

    category.updatedAt = new Date();
    await category.save();

    res.json(category);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   DELETE api/admin/categories/:id
// @desc    Delete a category
// @access  Private (Admin)
router.delete('/categories/:id', adminAuth, async (req, res) => {
  try {
    const category = await ServiceCategory.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ msg: 'Category not found' });
    }

    await ServiceCategory.findByIdAndDelete(req.params.id);
    res.json({ msg: 'Category deleted successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/admin/earnings
// @desc    Get earnings analytics (ultra-optimized with caching)
router.get('/earnings', adminAuth, async (req, res) => {
  try {
    // Single optimized aggregation pipeline for all earnings data
    const earningsData = await Booking.aggregate([
      {
        $match: {
          status: 'completed',
          paymentStatus: 'completed'
        }
      },
      {
        $facet: {
          // Total earnings and categories
          totalStats: [
            {
              $group: {
                _id: null,
                totalEarnings: { $sum: '$totalPrice' },
                totalBookings: { $sum: 1 },
                basicCount: {
                  $sum: { $cond: [{ $lt: ['$totalPrice', 200] }, 1, 0] }
                },
                standardCount: {
                  $sum: {
                    $cond: [
                      { $and: [{ $gte: ['$totalPrice', 200] }, { $lt: ['$totalPrice', 400] }] },
                      1, 0
                    ]
                  }
                },
                premiumCount: {
                  $sum: { $cond: [{ $gte: ['$totalPrice', 400] }, 1, 0] }
                },
                basicEarnings: {
                  $sum: { $cond: [{ $lt: ['$totalPrice', 200] }, '$totalPrice', 0] }
                },
                standardEarnings: {
                  $sum: {
                    $cond: [
                      { $and: [{ $gte: ['$totalPrice', 200] }, { $lt: ['$totalPrice', 400] }] },
                      '$totalPrice', 0
                    ]
                  }
                },
                premiumEarnings: {
                  $sum: { $cond: [{ $gte: ['$totalPrice', 400] }, '$totalPrice', 0] }
                }
              }
            }
          ],

          // Appointment types breakdown (including offline)
          appointmentTypes: [
            {
              $group: {
                _id: {
                  type: {
                    $cond: [
                      { $ifNull: ['$isOfflineBooking', false] },
                      'offline',
                      { $ifNull: ['$appointmentType', 'standard'] }
                    ]
                  }
                },
                totalEarnings: { $sum: '$totalPrice' },
                bookingCount: { $sum: 1 },
                averagePrice: { $avg: '$totalPrice' }
              }
            },
            {
              $project: {
                appointmentType: {
                  $cond: [
                    { $eq: ['$_id.type', 'offline'] },
                    'Offline',
                    {
                      $concat: [
                        { $toUpper: { $substrCP: ['$_id.type', 0, 1] } },
                        { $substrCP: ['$_id.type', 1, { $strLenCP: '$_id.type' }] }
                      ]
                    }
                  ]
                },
                appointmentTypeKey: '$_id.type',
                isOffline: { $eq: ['$_id.type', 'offline'] },
                totalEarnings: 1,
                platformFees: {
                  $cond: [
                    { $eq: ['$_id.type', 'offline'] },
                    0,
                    {
                      $switch: {
                        branches: [
                          { case: { $eq: ['$_id.type', 'Basic'] }, then: { $multiply: ['$bookingCount', 9] } },
                          { case: { $eq: ['$_id.type', 'Express'] }, then: { $multiply: ['$bookingCount', 19] } },
                          { case: { $eq: ['$_id.type', 'standard'] }, then: { $multiply: ['$bookingCount', 9] } }
                        ],
                        default: { $multiply: ['$bookingCount', 9] }
                      }
                    }
                  ]
                },
                bookingCount: 1,
                averagePrice: { $round: ['$averagePrice', 2] }
              }
            },
            { $sort: { bookingCount: -1 } }
          ],

          // Unified Offline bookings summary
          offlineBookings: [
            {
              $match: { isOfflineBooking: true }
            },
            {
              $group: {
                _id: 'offline',
                totalEarnings: { $sum: '$totalPrice' },
                bookingCount: { $sum: 1 },
                averagePrice: { $avg: '$totalPrice' }
              }
            },
            {
              $project: {
                appointmentType: { $literal: 'Offline' },
                totalEarnings: 1,
                platformFees: { $literal: 0 },
                bookingCount: 1,
                averagePrice: { $round: ['$averagePrice', 2] }
              }
            }
          ],

          // Daily earnings for last 30 days
          dailyEarnings: [
            {
              $match: {
                createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
              }
            },
            {
              $group: {
                _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                earnings: { $sum: '$totalPrice' },
                bookings: { $sum: 1 },
                platformFees: {
                  $sum: {
                    $cond: [
                      { $eq: ['$isOfflineBooking', true] },
                      0,
                      {
                        $switch: {
                          branches: [
                            { case: { $eq: ['$appointmentType', 'Basic'] }, then: 9 },
                            { case: { $eq: ['$appointmentType', 'Express'] }, then: 19 }
                          ],
                          default: 9
                        }
                      }
                    ]
                  }
                }
              }
            },
            {
              $project: {
                _id: 1,
                earnings: 1,
                platformFees: 1,
                bookings: 1
              }
            },
            { $sort: { '_id': 1 } }
          ],

          // Today's earnings
          todayEarnings: [
            {
              $match: {
                createdAt: {
                  $gte: new Date(new Date().setHours(0, 0, 0, 0)),
                  $lt: new Date(new Date().setHours(23, 59, 59, 999))
                }
              }
            },
            {
              $group: {
                _id: null,
                earnings: { $sum: '$totalPrice' },
                bookings: { $sum: 1 },
                platformFees: {
                  $sum: {
                    $cond: [
                      { $eq: ['$isOfflineBooking', true] },
                      0,
                      {
                        $switch: {
                          branches: [
                            { case: { $eq: ['$appointmentType', 'Basic'] }, then: 9 },
                            { case: { $eq: ['$appointmentType', 'Express'] }, then: 19 }
                          ],
                          default: 9
                        }
                      }
                    ]
                  }
                }
              }
            },
            {
              $project: {
                earnings: 1,
                platformFees: 1,
                bookings: 1
              }
            }
          ],

          // Barber earnings
          barberEarnings: [
            {
              $group: {
                _id: '$barberId',
                totalEarnings: { $sum: '$totalPrice' },
                bookingCount: { $sum: 1 },
                averageBooking: { $avg: '$totalPrice' },
                platformFees: {
                  $sum: {
                    $cond: [
                      { $eq: ['$isOfflineBooking', true] },
                      0,
                      {
                        $switch: {
                          branches: [
                            { case: { $eq: ['$appointmentType', 'Basic'] }, then: 9 },
                            { case: { $eq: ['$appointmentType', 'Express'] }, then: 19 }
                          ],
                          default: 9
                        }
                      }
                    ]
                  }
                }
              }
            },
            {
              $lookup: {
                from: 'users',
                localField: '_id',
                foreignField: '_id',
                as: 'barber'
              }
            },
            {
              $unwind: { path: '$barber', preserveNullAndEmptyArrays: true }
            },
            {
              $project: {
                barberId: '$_id',
                // Keep raw encrypted data here; we will decrypt it in the next step
                barberName: { $ifNull: ['$barber.name', 'Unknown Barber'] },
                barberEmail: { $ifNull: ['$barber.email', 'N/A'] },
                totalEarnings: 1,
                bookingCount: 1,
                averageBooking: { $round: ['$averageBooking', 2] },
                platformFees: 1,
                barberRevenue: '$totalEarnings'
              }
            },
            { $sort: { totalEarnings: -1 } }
          ]
        }
      }
    ]);

    const result = earningsData[0];

    // FIXED: Manually decrypt barber names and emails here because Aggregation bypasses Mongoose getters
    if (result.barberEarnings) {
      result.barberEarnings = result.barberEarnings.map(b => ({
        ...b,
        barberName: decrypt(b.barberName),
        barberEmail: decrypt(b.barberEmail)
      }));

      // --- BARBER SEARCH & DEFAULT LIMIT ---
      const searchQuery = req.query.search?.toLowerCase();
      if (searchQuery) {
        // If searching, filter by name or email
        result.barberEarnings = result.barberEarnings.filter(b =>
          b.barberName?.toLowerCase().includes(searchQuery) ||
          b.barberEmail?.toLowerCase().includes(searchQuery)
        );
      } else {
        // By default, only show the top 1 barber
        result.barberEarnings = result.barberEarnings.slice(0, 1);
      }
    }

    // Process the results
    const totalStats = result.totalStats[0] || {
      totalEarnings: 0, totalBookings: 0, basicCount: 0, standardCount: 0, premiumCount: 0,
      basicEarnings: 0, standardEarnings: 0, premiumEarnings: 0
    };

    // Calculate percentages for appointment types
    const totalBookings = result.appointmentTypes.reduce((sum, type) => sum + type.bookingCount, 0);
    const appointmentTypesWithPercentages = result.appointmentTypes.map(type => ({
      ...type,
      percentage: totalBookings > 0 ? ((type.bookingCount / totalBookings) * 100).toFixed(1) : 0
    }));

    // Calculate percentages for offline bookings
    const totalOfflineBookings = result.offlineBookings.reduce((sum, type) => sum + type.bookingCount, 0);
    const offlineBookingsWithPercentages = result.offlineBookings.map(type => ({
      ...type,
      percentage: totalOfflineBookings > 0 ? ((type.bookingCount / totalOfflineBookings) * 100).toFixed(1) : 0
    }));

    // Get pending payments count and earnings
    const pendingStats = await Booking.aggregate([
      {
        $match: {
          status: 'completed',
          paymentStatus: 'pending'
        }
      },
      {
        $group: {
          _id: null,
          pendingEarnings: { $sum: '$totalPrice' },
          pendingCount: { $sum: 1 }
        }
      }
    ]);

    const pendingData = pendingStats[0] || { pendingEarnings: 0, pendingCount: 0 };

    const response = {
      totalEarnings: totalStats.totalEarnings,
      totalPlatformFees: appointmentTypesWithPercentages.reduce((sum, type) => sum + type.platformFees, 0),
      bookingCategories: {
        basic: totalStats.basicCount,
        standard: totalStats.standardCount,
        premium: totalStats.premiumCount,
      },
      earningsByCategory: {
        basic: totalStats.basicEarnings,
        standard: totalStats.standardEarnings,
        premium: totalStats.premiumEarnings,
      },
      platformFeesByCategory: {
        basic: totalStats.basicEarnings * 0.1,
        standard: totalStats.standardEarnings * 0.1,
        premium: totalStats.premiumEarnings * 0.1,
      },
      appointmentTypes: appointmentTypesWithPercentages,
      offlineBookings: offlineBookingsWithPercentages,
      barberEarnings: result.barberEarnings,
      dailyEarnings: result.dailyEarnings,
      todayEarnings: result.todayEarnings[0] || { earnings: 0, platformFees: 0, bookings: 0 },
      pendingEarnings: pendingData.pendingEarnings,
      pendingPlatformFees: pendingData.pendingEarnings * 0.1,
      totalBookings: totalStats.totalBookings,
      pendingBookingsCount: pendingData.pendingCount,
      platformFeeRate: 'Online: ₹9-19 | Offline: Free'
    };

    res.json(response);
  } catch (err) {
    console.error('Earnings error:', err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/admin/user-stats/:userId
// @desc    Get real user statistics including completed bookings count
// @access  Private (Admin)
router.get('/user-stats/:userId', adminAuth, async (req, res) => {
  try {
    const userId = req.params.userId;

    // Get user basic info
    const user = await User.findById(userId).select('name email setkarCoins completedBookings');
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    // Get real completed bookings count from database
    const completedBookingsCount = await Booking.countDocuments({
      userId: userId,
      status: 'completed',
      paymentStatus: 'completed'
    });

    // Get total bookings count
    const totalBookingsCount = await Booking.countDocuments({
      userId: userId
    });

    // Get recent bookings (last 5)
    const recentBookings = await Booking.find({
      userId: userId
    })
      .populate('barberId', 'name')
      .sort({ createdAt: -1 })
      .limit(5)
      .select('date time status totalPrice createdAt');

    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        setkarCoins: user.setkarCoins || 0,
        storedCompletedBookings: user.completedBookings || 0, // Old stored value
        realCompletedBookings: completedBookingsCount, // Real count from DB
        totalBookings: totalBookingsCount
      },
      recentBookings: recentBookings.map(booking => ({
        id: booking._id,
        date: booking.date,
        time: booking.time,
        status: booking.status,
        totalPrice: booking.totalPrice,
        barberName: booking.barberId?.name || 'N/A',
        createdAt: booking.createdAt
      }))
    });
  } catch (err) {
    console.error('User stats error:', err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/admin/add-coins
// @desc    Add coins to a user (requires admin password verification)
// @access  Private (Admin)
router.post('/add-coins', adminAuth, async (req, res) => {
  const { userId, amount, adminPassword } = req.body;

  try {
    // Get the full admin object to access password comparison method
    const admin = await Admin.findById(req.admin._id);

    if (!admin) {
      return res.status(401).json({ msg: 'Admin not found' });
    }

    // Verify admin password using bcrypt directly
    const isPasswordValid = await bcrypt.compare(adminPassword, admin.password);

    if (!isPasswordValid) {
      return res.status(401).json({ msg: 'Invalid admin password' });
    }

    // Validate amount
    if (!amount || amount < 1 || amount > 10000) {
      return res.status(400).json({ msg: 'Invalid coin amount (1-10000)' });
    }

    // Find and update user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    // Update user's coin balance
    user.setkarCoins = (user.setkarCoins || 0) + amount;
    await user.save();

    // Log the transaction (you might want to create a transaction log model)
    console.log(`Admin ${admin.name} added ${amount} coins to user ${user.name} (${user.email})`);

    res.json({
      msg: 'Coins added successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        newBalance: user.setkarCoins
      }
    });
  } catch (err) {
    console.error('Add coins error:', err.message, err.stack);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/admin/audit-logs
// @desc    Get audit logs with filtering and pagination
// @access  Private (Admin)
router.get('/audit-logs', adminAuth, async (req, res) => {
  try {
    const AuditLog = require('../models/AuditLog');

    const {
      entity,
      entityId,
      userId,
      action,
      startDate,
      endDate,
      page = 1,
      limit = 50
    } = req.query;

    // Build filter object
    const filter = {};

    if (entity) filter.entity = entity;
    if (entityId) filter.entityId = entityId;
    if (userId) filter.userId = userId;
    if (action) filter.action = action;

    // Date range filter
    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) filter.timestamp.$gte = new Date(startDate);
      if (endDate) filter.timestamp.$lte = new Date(endDate);
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get audit logs with pagination
    const auditLogs = await AuditLog.find(filter)
      .populate('userId', 'name email')
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Decrypt user names and emails for admin viewing
    const decryptedAuditLogs = auditLogs.map(log => ({
      ...log,
      userId: log.userId ? {
        ...log.userId,
        name: log.userId.name ? decrypt(log.userId.name) : undefined,
        email: log.userId.email ? decrypt(log.userId.email) : undefined
      } : null
    }));

    // Get total count for pagination
    const total = await AuditLog.countDocuments(filter);

    res.json({
      auditLogs: decryptedAuditLogs,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalRecords: total,
        hasNext: skip + parseInt(limit) < total,
        hasPrev: parseInt(page) > 1
      }
    });
  } catch (err) {
    console.error('Audit logs fetch error:', err.message);
    res.status(500).send('Server Error');
  }
});

// @route   DELETE api/admin/delete-user/:userId
// @desc    Completely delete a user account and all associated data (admin only)
// @access  Private (Admin)
router.delete('/delete-user/:userId', adminAuth, async (req, res) => {
  try {
    const userId = req.params.userId;

    // Find the user first
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    // Delete all associated data
    const BarberCard = require('../models/BarberCard');
    const Booking = require('../models/Booking');
    const Review = require('../models/Review');
    const Notification = require('../models/Notification');
    const ChatMessage = require('../models/ChatMessage');
    const SetkarCoinTransaction = require('../models/SetkarCoinTransaction');

    // Delete barber cards
    await BarberCard.deleteMany({ barberId: userId });

    // Delete bookings (both as barber and customer)
    await Booking.deleteMany({ $or: [{ barberId: userId }, { userId: userId }] });

    // Delete reviews (both given and received)
    await Review.deleteMany({ $or: [{ barberId: userId }, { userId: userId }] });

    // Delete notifications
    await Notification.deleteMany({ userId: userId });

    // Delete chat messages
    await ChatMessage.deleteMany({ $or: [{ senderId: userId }, { receiverId: userId }] });

    // Delete coin transactions
    await SetkarCoinTransaction.deleteMany({ userId: userId });

    // Handle shop ownership/staff relationships
    const Shop = require('../models/Shop');
    const shop = await Shop.findOne({ owner: userId });

    if (shop) {
      // If user is shop owner, delete the entire shop
      await Shop.findByIdAndDelete(shop._id);
    } else {
      // If user is staff, remove them from staff array
      await Shop.updateMany(
        { staff: userId },
        { $pull: { staff: userId } }
      );
    }

    // Finally, delete the user account
    await User.findByIdAndDelete(userId);

    console.log(`Admin deleted user account: ${user.name} (${user.email}) - ID: ${userId}`);

    res.json({
      msg: 'User account and all associated data deleted successfully',
      deletedUser: {
        id: userId,
        name: user.name,
        email: user.email
      }
    });
  } catch (err) {
    console.error('Delete user account error:', err.message, err.stack);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/admin/subscription-plans
// @desc    Get all subscription plans
// @access  Private (Admin)
router.get('/subscription-plans', adminAuth, async (req, res) => {
  try {
    const plans = await SubscriptionPlan.find().sort({ createdAt: -1 });
    res.json(plans);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/admin/subscription-plans
// @desc    Create a new subscription plan
// @access  Private (Admin)
router.post('/subscription-plans', adminAuth, async (req, res) => {
  try {
    const { name, price, durationDays, durationUnit, features } = req.body;
    const plan = new SubscriptionPlan({
      name,
      price,
      durationDays,
      durationUnit: durationUnit || 'days',
      features
    });
    await plan.save();
    res.json(plan);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/admin/subscription-plans/:id
// @desc    Update a subscription plan
// @access  Private (Admin)
router.put('/subscription-plans/:id', adminAuth, async (req, res) => {
  try {
    const { name, price, durationDays, durationUnit, features, isActive } = req.body;
    const plan = await SubscriptionPlan.findById(req.params.id);
    if (!plan) return res.status(404).json({ msg: 'Plan not found' });

    if (name) plan.name = name;
    if (price !== undefined) plan.price = price;
    if (durationDays !== undefined) plan.durationDays = durationDays;
    if (durationUnit) plan.durationUnit = durationUnit;
    if (features) plan.features = features;
    if (isActive !== undefined) plan.isActive = isActive;

    await plan.save();
    res.json(plan);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   DELETE api/admin/subscription-plans/:id
// @desc    Delete a subscription plan (Soft delete by setting isActive to false)
// @access  Private (Admin)
router.delete('/subscription-plans/:id', adminAuth, async (req, res) => {
  try {
    const plan = await SubscriptionPlan.findById(req.params.id);
    if (!plan) return res.status(404).json({ msg: 'Plan not found' });

    plan.isActive = false;
    await plan.save();
    res.json({ msg: 'Plan deactivated' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/admin/subscription-stats
// @desc    Get subscription statistics (count per plan)
// @access  Private (Admin)
router.get('/subscription-stats', adminAuth, async (req, res) => {
  try {
    const BarberSubscription = require('../models/BarberSubscription');

    const stats = await BarberSubscription.aggregate([
      { $match: { status: 'active' } },
      {
        $group: {
          _id: '$planId',
          count: { $sum: 1 }
        }
      }
    ]);

    // Convert to a more frontend-friendly map { planId: count }
    const statsMap = {};
    stats.forEach(item => {
      statsMap[String(item._id)] = item.count;
    });

    res.json(statsMap);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error fetching subscription stats');
  }
});

// @route   GET api/admin/subscriptions
// @desc    Get all active subscriptions with details
// @access  Private (Admin)
router.get('/subscriptions', adminAuth, async (req, res) => {
  try {
    const BarberSubscription = require('../models/BarberSubscription');

    const subscriptions = await BarberSubscription.find({ status: 'active' })
      .populate('barberId', 'name email phone profilePicture')
      .populate('planId', 'name price durationDays')
      .sort({ startDate: -1 });

    res.json(subscriptions);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error fetching subscriptions');
  }
});

module.exports = router;
