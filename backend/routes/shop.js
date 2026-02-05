const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Shop = require('../models/Shop');
const Booking = require('../models/Booking');
const BarberCard = require('../models/BarberCard');
const User = require('../models/User');
const { checkEffectiveSubscription } = require('../utils/subscriptionHelper');
const ListingPlace = require('../models/ListingPlace');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const { uploadToR2, extractKeyFromUrl, uploadToR2WithCleanup } = require('../utils/r2Storage');
// 1. IMPORT DECRYPT: Required for fixing Aggregation "Invisible Text" bugs
const { decrypt } = require('../utils/EncryptionService');
const validate = require('../middleware/validate');
const schemas = require('../utils/validationSchemas');

// Ultra-efficient in-memory cache with TTL (use Redis in production)
const shopCache = new Map();
const SHOP_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Cache management functions
const getCached = (key) => {
  const cached = shopCache.get(key);
  if (cached && Date.now() - cached.timestamp < SHOP_CACHE_DURATION) {
    return cached.data;
  }
  shopCache.delete(key);
  return null;
};

const setCached = (key, data) => {
  shopCache.set(key, { data, timestamp: Date.now() });
  // Prevent memory leaks - limit cache size
  if (shopCache.size > 100) {
    const firstKey = shopCache.keys().next().value;
    shopCache.delete(firstKey);
  }
};

// Ensure the uploads directory exists
const uploadsDir = path.join(__dirname, '../../barber-app/Uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Set up multer for file uploads (memory storage for R2)
// Set up multer for file uploads (memory storage for R2)
const storage = multer.memoryStorage();
const upload = multer({ storage });

// @route   GET api/shop/popular-services
// @desc    Get top popular services by frequency
// @access  Public
router.get('/popular-services', async (req, res) => {
  try {
    // Check cache first
    const cached = getCached('popular_services');
    if (cached) return res.json(cached);

    const services = await Shop.aggregate([
      // 1. Unwind services array
      { $unwind: "$services" },
      // 2. Normalize and Group
      {
        $group: {
          _id: { $toLower: "$services.name" }, // Group by lowercase to merge "Haircut" and "haircut"
          originalName: { $first: "$services.name" }, // Keep one original casing for display
          count: { $sum: 1 }
        }
      },
      // 3. Sort by popularity
      { $sort: { count: -1 } },
      // 4. Limit to top 8
      { $limit: 8 },
      // 5. Project final format
      {
        $project: {
          _id: 0,
          name: "$originalName",
          count: 1
        }
      }
    ]);

    // Cache for performance (1 hour? or 5 mins like others)
    setCached('popular_services', services);

    res.json(services);
  } catch (err) {
    console.error('Error fetching popular services:', err.message);
    res.status(500).send('Server Error');
  }
});

// Helper function to calculate barber score based on rating and review count
function calculateBarberScore(rating, reviewCount) {
  // Primary factor: rating (0-5)
  // Secondary factor: review count (logarithmic to prevent very high review counts from dominating)
  // This gives higher weight to rating but also considers review volume
  const reviewWeight = Math.log(reviewCount + 1) / Math.log(100); // Normalize review count impact
  return rating * (1 + reviewWeight * 0.1); // Rating gets 90-100% weight, reviews add up to 10%
}

// Helper function to track changes efficiently
function trackShopChanges(shop, updates) {
  const changes = [];
  const fieldDescriptions = {
    name: (oldVal, newVal) => `Shop name changed from "${oldVal}" to "${newVal}"`,
    address: (oldVal, newVal) => `Address changed from "${oldVal}" to "${newVal}"`,
    phone: (oldVal, newVal) => `Phone changed from "${oldVal}" to "${newVal}"`,
    services: (oldVal, newVal) => `Services updated from ${oldVal?.length || 0} to ${newVal.length} services`,
    tag: (oldVal, newVal) => `Tag changed from "${oldVal}" to "${newVal}"`,
    location: () => 'Location coordinates updated',
    avgAppointmentTime: (oldVal, newVal) => `Average appointment time changed from "${oldVal}" to "${newVal}"`,
    isAvailable: (oldVal, newVal) => `Availability changed from ${oldVal ? 'available' : 'unavailable'} to ${newVal ? 'available' : 'unavailable'}`,
    image: () => 'Shop image updated',
    upiId: (oldVal, newVal) => `UPI ID changed from "${oldVal}" to "${newVal}"`,
    operatingHours: () => 'Operating hours updated'
  };

  // Initialize pendingChanges and changeDetails
  shop.pendingChanges = shop.pendingChanges || {};
  shop.changeDetails = shop.changeDetails || [];

  // Process each update field
  Object.keys(updates).forEach(field => {
    const newValue = updates[field];
    const currentValue = shop[field];

    // Skip undefined values and unchanged values
    if (newValue === undefined || JSON.stringify(newValue) === JSON.stringify(currentValue)) {
      return;
    }

    // Track the change
    shop.pendingChanges[field] = newValue;
    const description = fieldDescriptions[field]
      ? fieldDescriptions[field](currentValue, newValue)
      : `${field} updated`;

    changes.push({
      field,
      oldValue: currentValue,
      newValue,
      description
    });
  });

  // Add new changes to changeDetails
  if (changes.length > 0) {
    shop.changeDetails.push(...changes);
  }

  return changes;
}

// @route   GET api/shop/featured-barbers
// @desc    Get top-rated barbers from each service provider type for featured section
// @access  Public
router.get('/featured-barbers', async (req, res) => {
  try {
    // Define the categories we want to feature
    const categories = ["Barber", "Women's Salon", "Pet Care"];

    // Use aggregation pipeline for optimal performance
    const featuredBarbers = await Shop.aggregate([
      {
        $match: {
          category: { $in: categories },
          approvalStatus: 'approved'
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'owner',
          foreignField: '_id',
          as: 'owner'
        }
      },
      {
        $unwind: { path: '$owner', preserveNullAndEmptyArrays: true }
      },
      {
        $addFields: {
          barberScore: {
            $add: [
              { $ifNull: ['$rating', 0] },
              {
                $multiply: [
                  { $log10: { $add: [{ $ifNull: ['$reviews', 0] }, 1] } },
                  0.1
                ]
              }
            ]
          },
          lowestServicePrice: {
            $cond: {
              if: { $and: [{ $isArray: '$services' }, { $gt: [{ $size: '$services' }, 0] }] },
              then: { $min: { $map: { input: '$services', as: 'service', in: { $toDouble: { $ifNull: ['$$service.price', '200'] } } } } },
              else: 200
            }
          }
        }
      },
      {
        $sort: { barberScore: -1 }
      },
      {
        $group: {
          _id: '$category',
          topShop: { $first: '$$ROOT' }
        }
      },
      {
        $replaceRoot: { newRoot: '$topShop' }
      }
    ]);

    // Transform the data to match the frontend expected format
    const result = featuredBarbers.map(shop => {
      const barber = shop.owner;
      const displayRating = shop.rating || 0;

      // 2. MANUAL DECRYPTION: Required because Aggregations bypass Mongoose getters
      // Since 'name', 'address', 'phone' are encrypted objects in DB, we must decrypt them here.
      const shopName = decrypt(shop.name);
      const barberName = decrypt(barber.name);
      const shopAddress = decrypt(shop.address);
      const shopPhone = decrypt(shop.phone);

      return {
        id: barber._id,
        name: shopName || barberName, // Use decrypted name
        rating: displayRating,
        distance: '2.5 km', // This would need to be calculated based on user location
        price: shop.lowestServicePrice,
        nextSlot: '10:30 AM', // This would need to be calculated based on availability
        img: shop.image || barber.profilePicture || 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=800&q=80',
        verified: true, // Assuming all listed shops are verified
        shopAddress: shopAddress, // Use decrypted address
        shopPhone: shopPhone,     // Use decrypted phone
        category: shop.category,
        reviewsCount: shop.reviews || 0,
        services: shop.services || []
      };
    });

    // Sort by rating (highest first) to ensure the best ones appear first
    result.sort((a, b) => b.rating - a.rating);

    res.json(result);
  } catch (err) {
    console.error('Error fetching featured barbers:', err);
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
});

// @route   POST api/shop
// @desc    Create a new shop for the current user
// @access  Private
router.post('/', auth, validate(schemas.createShop), async (req, res) => {
  const { name, address, phone, category } = req.body;

  try {
    // Check if user already owns a shop
    const existingShop = await Shop.findOne({ owner: req.user.id });
    if (existingShop) {
      return res.status(400).json({ msg: 'You already own a shop' });
    }

    // Check if user is staff at another shop
    const staffShop = await Shop.findOne({ staff: req.user.id });
    if (staffShop) {
      // Allow staff to create their own shop
      // Remove them from the staff array of the previous shop
      staffShop.staff = staffShop.staff.filter(id => id.toString() !== req.user.id);
      await staffShop.save();
    }

    // Create new shop (Automatic encryption via Mongoose setters)
    const shop = new Shop({
      owner: req.user.id,
      name,
      address,
      phone,
      category,
      approvalStatus: 'pending', // New shops start as pending approval
    });

    await shop.save();
    res.json(shop);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/shop
// @desc    Get all shops (public) or current user's shop (if authenticated)
// @access  Public/Private
router.get('/', async (req, res) => {
  try {
    // Check if user is authenticated
    if (req.user && req.user.id) {
      // Return user's shop if authenticated
      const shop = await Shop.findOne({ owner: req.user.id }).populate({
        path: 'selectedListingPlaces',
        populate: {
          path: 'lockedBy',
          select: 'name profilePicture',
        },
      });

      if (!shop) {
        return res.status(404).json({ msg: 'Shop not found - you may not own a shop or be staff at one' });
      }

      return res.json(shop);
    } else {
      // Return all approved shops if not authenticated (public access)
      const shops = await Shop.find({ approvalStatus: 'approved' })
        .populate('owner', 'name email phone profilePicture maxAppointmentsPerDay rating reviews isAvailable')
        .populate('staff', 'name email phone profilePicture maxAppointmentsPerDay rating reviews isAvailable')
        .populate({
          path: 'selectedListingPlaces',
          populate: { path: 'lockedBy', select: 'name profilePicture' },
        });

      // Since sorting in DB by array min is tricky with populate, we'll sort in memory later if needed
      // or just keep this and sort below.


      // Process shops with booking counts (similar to /all route)
      const shopsWithData = shops.map((shop) => {
        const owner = shop.owner;
        const staffMembers = shop.staff || [];
        const shopBarbers = [owner, ...staffMembers].filter(Boolean);
        const availableBarbers = shopBarbers.filter(b => b.isAvailable && b.maxAppointmentsPerDay > 0);
        const todaysBookings = availableBarbers.reduce((sum, b) => sum + (b.todaysBookings || 0), 0);
        const totalMaxAppointments = availableBarbers.reduce((sum, b) => sum + (b.maxAppointmentsPerDay || 0), 0);

        const averageRating = shopBarbers.length > 0
          ? shopBarbers.reduce((sum, b) => sum + (b.rating || 0), 0) / shopBarbers.length
          : 0;

        return {
          ...shop.toObject(),
          rating: averageRating,
          todaysBookings,
          totalMaxAppointments,
          isAvailable: shopBarbers.some(b => b.isAvailable),
          totalBarbers: shopBarbers.length,
        };
      }).sort((a, b) => {
        // Find best tier across all categories
        const findBestTier = (shop) => {
          if (!shop.selectedListingPlaces || shop.selectedListingPlaces.length === 0) return Infinity;
          return Math.min(...shop.selectedListingPlaces.map(lp => lp.tierId));
        };
        const tierA = findBestTier(a);
        const tierB = findBestTier(b);
        return tierA - tierB;
      });

      res.json(shopsWithData);
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/shop
// @desc    Update user's shop
// @access  Private
router.put('/', auth, validate(schemas.updateShop), async (req, res) => {
  const { name, address, phone, services, tag, location, avgAppointmentTime, isAvailable, image, upiId, operatingHours } = req.body;

  try {
    let shop = await Shop.findOne({ owner: req.user.id });

    if (!shop) {
      return res.status(404).json({ msg: 'Shop not found' });
    }

    // Store original data if this is the first time going to pending
    if (shop.approvalStatus === 'approved') {
      shop.originalData = {
        name: shop.name,
        address: shop.address,
        phone: shop.phone,
        services: shop.services,
        tag: shop.tag,
        location: shop.location,
        avgAppointmentTime: shop.avgAppointmentTime,
        isAvailable: shop.isAvailable,
        image: shop.image,
        upiId: shop.upiId,
        operatingHours: shop.operatingHours,
      };
    }

    // Track changes using optimized helper function
    const changes = trackShopChanges(shop, req.body);

    // Set approval status to pending when updated (only if not already approved)
    if (changes.length > 0) {
      if (shop.approvalStatus !== 'approved') {
        shop.approvalStatus = 'pending';
      }

      // Actually update the shop fields (Mongoose setters handle re-encryption)
      Object.keys(req.body).forEach(key => {
        if (req.body[key] !== undefined) {
          shop[key] = req.body[key];
        }
      });

      await shop.save();
    }
    res.json({
      shop,
      changes: changes,
      pendingChanges: shop.pendingChanges,
      changeDetails: shop.changeDetails
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/shop/category
// @desc    Update user's shop category
// @access  Private
router.put('/category', auth, validate(schemas.updateShopCategory), async (req, res) => {
  const { category } = req.body;

  try {
    let shop = await Shop.findOne({ owner: req.user.id });

    if (!shop) {
      return res.status(404).json({ msg: 'Shop not found' });
    }

    if (shop.listingConfirmed) {
      return res.status(400).json({ msg: 'Category cannot be changed after listing is confirmed.' });
    }

    if (category) shop.category = category;

    // Set approval status to pending when category is updated
    shop.approvalStatus = 'pending';

    await shop.save();
    res.json({ success: true, shop });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/shop/confirm-listing
// @desc    Confirm user's shop listing
// @access  Private
router.put('/confirm-listing', auth, async (req, res) => {
  try {
    let shop = await Shop.findOne({ owner: req.user.id });

    if (!shop) {
      return res.status(404).json({ msg: 'Shop not found' });
    }

    if (shop.listingConfirmed) {
      return res.status(400).json({ msg: 'Listing is already confirmed and cannot be changed.' });
    }

    shop.listingConfirmed = true;
    await shop.save();
    res.json({ success: true, shop });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/shop/all
// @desc    Get all shops (HEAVILY OPTIMIZED - NO CACHING for real-time availability)
// @access  Public
router.get('/all', async (req, res) => {
  try {
    const { category, page, limit } = req.query;
    let filter = {};
    if (category) {
      filter.category = { $in: category.split(',') };
    }

    // Ensure only approved shops are returned
    filter.approvalStatus = 'approved';

    // --- SUBSCRIPTION FILTER ---
    // Fetch IDs of barbers with active AND unexpired subscriptions
    const User = require('../models/User');
    const now = new Date();
    const subscribedBarbers = await User.find({
      role: 'barber',
      subscriptionStatus: 'active',
      subscriptionExpiry: { $gt: now }
    }).select('_id');
    const subscribedBarberIds = subscribedBarbers.map(b => b._id);
    filter.owner = { $in: subscribedBarberIds };
    // ---------------------------

    // 1. Pagination Setup
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 0; // 0 means no limit (backward compatibility)
    const skip = limitNum > 0 ? (pageNum - 1) * limitNum : 0;

    // 2. Fetch Shops with Pagination - All shops for now (temporarily)
    let shopQuery = Shop.find(filter)
      .populate({
        path: 'owner',
        select: 'name email phone profilePicture maxAppointmentsPerDay rating reviews isAvailable',
        match: { _id: { $exists: true } } // Only populate if owner exists
      })
      .populate({
        path: 'staff',
        select: 'name email phone profilePicture maxAppointmentsPerDay rating reviews isAvailable',
        match: { _id: { $exists: true } } // Only populate if staff exist
      })
      .populate({
        path: 'selectedListingPlaces',
        populate: { path: 'lockedBy', select: 'name profilePicture' },
      });

    // Only apply DB limit if we aren't doing complex sorting in memory later
    if (limitNum > 0) {
      shopQuery = shopQuery.skip(skip).limit(limitNum);
    }

    const shops = await shopQuery;

    // 3. Process Data in Memory (Simplified - use populated data directly)
    const shopsWithBookingCounts = shops
      .filter(shop => shop.owner) // Filter out orphaned shops (deleted owners)
      .map((shop) => {
        // Use the populated owner and staff data directly
        const owner = shop.owner;
        const staffMembers = shop.staff || [];

        const shopBarbers = [owner, ...staffMembers].filter(Boolean);
        const availableBarbers = shopBarbers.filter(b => b && b.isAvailable && b.maxAppointmentsPerDay > 0);
        const hasAnyAvailableBarber = shopBarbers.some(b => b && b.isAvailable);

        const todaysBookings = availableBarbers.reduce((sum, b) => sum + (b.todaysBookings || 0), 0);
        const totalMaxAppointments = availableBarbers.reduce((sum, b) => sum + (b.maxAppointmentsPerDay || 0), 0);

        // Calculate average rating from all barbers (owner + staff) using populated data
        // Only include barbers with rating > 0
        let totalRating = 0;
        let totalReviews = 0;
        let barberCount = 0;

        if (owner && owner.rating > 0) {
          totalRating += owner.rating;
          totalReviews += owner.reviews || 0;
          barberCount++;
        }

        staffMembers.forEach(staffUser => {
          if (staffUser && staffUser.rating > 0) {
            totalRating += staffUser.rating;
            totalReviews += staffUser.reviews || 0;
            barberCount++;
          }
        });

        const averageRating = barberCount > 0 ? totalRating / barberCount : 0;

        return {
          ...shop.toObject(),
          rating: averageRating, // Override shop rating with barber average
          todaysBookings,
          totalMaxAppointments,
          isAvailable: hasAnyAvailableBarber,
          shopRating: averageRating,
          totalBarbers: barberCount,
          totalReviews: totalReviews,
        };
      });

    // 5. Sort by listing tier for the requested category
    if (limitNum === 0 || true) { // Always sort by tier if possible
      shopsWithBookingCounts.sort((a, b) => {
        // Find the tier for the requested category
        const findTier = (shop) => {
          if (!category || !shop.selectedListingPlaces) return Infinity;
          const targetCat = category.split(',')[0]; // Use first requested category for ranking
          const lp = shop.selectedListingPlaces.find(p => p.category === targetCat);
          return lp ? lp.tierId : Infinity;
        };

        const tierA = findTier(a);
        const tierB = findTier(b);
        return tierA - tierB;
      });
    }

    // 6. Apply Pagination Slicing if needed
    let result = shopsWithBookingCounts;
    if (limitNum > 0 && skip > 0) {
      result = shopsWithBookingCounts.slice(skip, skip + limitNum);
    }

    // Prevent caching of approval-sensitive data
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
    res.json(result);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/shop/locked-places
// @desc    Get all currently locked listing places, optionally filtered by category
// @access  Public
router.get('/locked-places', async (req, res) => {
  try {
    const { category } = req.query;
    let filter = {};
    if (category) {
      filter.category = category;
    }
    const lockedPlaces = await ListingPlace.find(filter).populate('lockedBy', 'name profilePicture');
    res.json(lockedPlaces);
  } catch (err) {
    console.error('Error fetching locked places:', err);
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
});

// @route   GET api/shop/my-shop
// @desc    Get shop where user is either owner or staff member
// @access  Private
router.get('/my-shop', auth, async (req, res) => {
  try {
    // First try to find shop where user is the owner
    let shop = await Shop.findOne({ owner: req.user.id })
      .populate('staff', 'name email phone profilePicture rating reviews') // Populate staff details
      .populate({
        path: 'selectedListingPlaces',
        populate: {
          path: 'lockedBy',
          select: 'name profilePicture',
        },
      });

    if (!shop) {
      // If not owner, check if user is staff at any shop
      shop = await Shop.findOne({ staff: req.user.id })
        .populate('owner', 'name email phone profilePicture rating reviews') // Populate owner details
        .populate('staff', 'name email phone profilePicture rating reviews') // Populate all staff details
        .populate({
          path: 'selectedListingPlaces',
          populate: {
            path: 'lockedBy',
            select: 'name profilePicture',
          },
        });
    }

    if (!shop) {
      return res.status(404).json({ msg: 'No shop found for this user' });
    }

    // Add a flag to indicate if user is the main owner
    const isMainOwner = shop.owner._id.toString() === req.user.id;

    // --- SUBSCRIPTION GATING FOR COORDINATES ---
    const subscription = await checkEffectiveSubscription(req.user.id);
    const result = shop.toObject();

    if (!subscription.isActive) {
      if (result.location) {
        result.location.coordinates = [0, 0];
      }
    }
    // ------------------------------------------

    res.json({ ...result, isMainOwner });
  } catch (err) {
    console.error('Error fetching user shop:', err);
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
});

// @route   GET api/shop/barber/:barberId
// @desc    Get shop by barber (owner) ID
// @access  Public
router.get('/barber/:barberId', async (req, res) => {
  try {
    const shop = await Shop.findOne({ owner: req.params.barberId })
      .populate('owner', ['name', 'profilePicture'])
      .populate('selectedListingPlaces');
    if (!shop) {
      return res.status(404).json({ msg: 'Shop not found for this barber.' });
    }
    res.json(shop);
  } catch (err) {
    console.error('Error fetching shop by barber ID:', err);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/shop/:id
// @desc    Get shop by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const shop = await Shop.findById(req.params.id)
      .populate('owner', ['name', 'profilePicture'])
      .populate('selectedListingPlaces');
    if (!shop) {
      return res.status(404).json({ msg: 'Shop not found' });
    }

    // Calculate customers served
    const customersServed = await Booking.distinct('userId', {
      barberId: shop.owner._id,
      status: { $ne: 'cancelled' },
    });

    res.json({ ...shop.toObject(), customersServed: customersServed.length });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Shop not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   GET api/shop/barbers/:shopId
// @desc    Get all approved barber cards for a shop
// @access  Public
router.get('/barbers/:shopId', async (req, res) => {
  try {
    const barberCards = await BarberCard.find({ shopId: req.params.shopId, approvalStatus: 'approved' })
      .populate('barberId', 'profilePicture rating reviews')
      .sort({ createdAt: -1 });

    res.json(barberCards);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/shop/tag
// @desc    Update user's shop tag
// @access  Private
router.put('/tag', auth, validate(schemas.updateShopTag), async (req, res) => {
  const { tag } = req.body;

  try {
    let shop = await Shop.findOne({ owner: req.user.id });

    if (!shop) {
      return res.status(404).json({ msg: 'Shop not found' });
    }

    if (tag) shop.tag = tag;

    await shop.save();
    res.json({ success: true, shop });
  } catch (err) {
    console.error('Error updating tag:', err);
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
});

// @route   PUT api/shop/listing-tier
// @desc    Update user's shop listing tier
// @access  Private
router.put('/listing-tier', auth, validate(schemas.updateListingTier), async (req, res) => {
  const { tierId, category } = req.body;

  try {
    let shop = await Shop.findOne({ owner: req.user.id });

    if (!shop) {
      return res.status(404).json({ msg: 'Shop not found' });
    }

    if (!category) {
      return res.status(400).json({ msg: 'Category is required for listing tier operations.' });
    }

    // Release any existing lock for the current user and category first
    const existingListing = await ListingPlace.findOneAndDelete({ lockedBy: req.user.id, category });
    if (existingListing) {
      shop.selectedListingPlaces = shop.selectedListingPlaces.filter(
        id => id.toString() !== existingListing._id.toString()
      );
    }

    // If a new tierId is provided, attempt to lock it
    if (tierId) {
      // Check if the requested tier for this category is already locked by anyone
      const conflictingLock = await ListingPlace.findOne({ tierId, category });
      if (conflictingLock) {
        return res.status(400).json({ msg: 'This place is already booked by another barber for this category.' });
      }

      // Lock the new tier for the current user and category
      const newListingPlace = new ListingPlace({
        tierId,
        category,
        lockedBy: req.user.id,
      });
      await newListingPlace.save();
      shop.selectedListingPlaces.push(newListingPlace._id);
    }

    await shop.save();

    // Populate the selectedListingPlaces and lockedBy for the response
    const updatedShop = await Shop.findById(shop._id)
      .populate({
        path: 'selectedListingPlaces',
        populate: {
          path: 'lockedBy',
          select: 'name profilePicture', // Select relevant barber info
        },
      });

    res.json({ success: true, shop: updatedShop });
  } catch (err) {
    console.error('Error updating listing tier:', err);
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
});

// @route   PUT api/shop/increment-click/:shopId
// @desc    Increment click count for a shop
// @access  Public
router.put('/increment-click/:shopId', async (req, res) => {
  try {
    const shop = await Shop.findById(req.params.shopId);

    if (!shop) {
      return res.status(404).json({ msg: 'Shop not found' });
    }

    shop.clickCount = (shop.clickCount || 0) + 1;
    await shop.save();

    res.json({ success: true, clickCount: shop.clickCount });
  } catch (err) {
    console.error('Error incrementing click count:', err);
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
});

// @route   PUT api/shop/barber/cancel-listing/:barberId
// @desc    Cancel a barber's listing
// @access  Private
router.put('/barber/cancel-listing/:barberId', auth, async (req, res) => {
  try {
    const shop = await Shop.findOne({ owner: req.params.barberId });

    if (!shop) {
      return res.status(404).json({ msg: 'Shop not found' });
    }

    // Check if the authenticated user is the owner of the shop
    if (shop.owner.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'User not authorized' });
    }

    const { category } = req.body;
    if (!category) {
      return res.status(400).json({ msg: 'Category is required to cancel a listing.' });
    }

    // Find and delete the listing place for this category and user
    const deletedListing = await ListingPlace.findOneAndDelete({ lockedBy: req.params.barberId, category });

    if (deletedListing) {
      // Remove from shop.selectedListingPlaces array
      shop.selectedListingPlaces = shop.selectedListingPlaces.filter(
        id => id.toString() !== deletedListing._id.toString()
      );

      // If no listings left, maybe reset listingConfirmed? (Optional, based on business logic)
      if (shop.selectedListingPlaces.length === 0) {
        shop.listingConfirmed = false;
      }

      await shop.save();
    }

    res.json({ success: true, msg: 'Listing cancelled successfully.' });
  } catch (err) {
    console.error('Error cancelling listing:', err);
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
});

// @route   POST api/shop/listing-place
// @desc    Activate listing place after payment (update existing or create if needed)
// @access  Private
router.post('/listing-place', auth, validate(schemas.listingPlace), async (req, res) => {
  const { tier, price, duration } = req.body;

  try {
    let shop = await Shop.findOne({ owner: req.user.id });

    if (!shop) {
      return res.status(404).json({ msg: 'Shop not found' });
    }

    if (!shop.category) {
      return res.status(400).json({ msg: 'Shop category must be set before activating a listing.' });
    }

    const targetCategory = req.body.category || shop.category;

    // Release current user's existing lock for THIS CATEGORY
    const existingListing = await ListingPlace.findOneAndDelete({ lockedBy: req.user.id, category: targetCategory });
    if (existingListing) {
      shop.selectedListingPlaces = shop.selectedListingPlaces.filter(
        id => id.toString() !== existingListing._id.toString()
      );
    }

    // Create and save new listing
    listingPlace = new ListingPlace({
      tierId: tier,
      category: targetCategory,
      lockedBy: req.user.id,
      price,
      duration,
      lockedAt: new Date()
    });
    await listingPlace.save();

    // Add to shop's selectedListingPlaces
    shop.selectedListingPlaces.push(listingPlace._id);
    shop.listingConfirmed = true;
    await shop.save();

    res.status(201).json(listingPlace);
  } catch (err) {
    console.error('Error activating listing place:', err);
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
});


// @route   POST api/shop/upload-image
// @desc    Upload shop image
// @access  Private
router.post('/upload-image', auth, upload.single('shopImage'), async (req, res) => {
  try {
    if (!req.file) {
      console.log('❌ Shop upload: No file uploaded');
      return res.status(400).json({ msg: 'No file uploaded' });
    }

    console.log('📤 Shop upload: File received:', {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size
    });

    // Check if R2 is configured
    const isR2Configured = process.env.R2_ACCESS_KEY_ID &&
      process.env.R2_SECRET_ACCESS_KEY &&
      process.env.R2_BUCKET_NAME &&
      process.env.R2_ENDPOINT &&
      process.env.R2_PUBLIC_URL &&
      !process.env.R2_ACCESS_KEY_ID.includes('your_');

    console.log('🔍 R2 Configuration Status:', {
      isR2Configured,
      hasAccessKey: !!process.env.R2_ACCESS_KEY_ID,
      hasSecretKey: !!process.env.R2_SECRET_ACCESS_KEY,
      hasBucket: !!process.env.R2_BUCKET_NAME,
      hasEndpoint: !!process.env.R2_ENDPOINT,
      hasPublicUrl: !!process.env.R2_PUBLIC_URL
    });

    // Get current shop to find existing image for cleanup
    let currentShop = null;
    try {
      currentShop = await Shop.findOne({ owner: req.user.id });
    } catch (dbErr) {
      console.log('⚠️ Could not fetch current shop for cleanup:', dbErr.message);
    }

    const oldImageUrl = currentShop?.image;

    if (isR2Configured) {
      console.log('☁️ Attempting upload to Cloudflare R2 with cleanup...');
      let uploadBuffer = req.file.buffer;
      let uploadFilename = req.file.originalname;
      let uploadMimetype = req.file.mimetype;

      // Optimize Image
      if (req.file.mimetype.startsWith('image')) {
        console.log(`🖼️ Optimizing shop image: ${req.file.originalname}`);
        try {
          uploadBuffer = await sharp(req.file.buffer)
            .rotate() // Auto-rotate based on EXIF data
            .resize({ width: 1280, withoutEnlargement: true })
            .webp({ quality: 80 })
            .toBuffer();

          uploadFilename = `${path.parse(req.file.originalname).name}.webp`;
          uploadMimetype = 'image/webp';
          console.log(`✅ Shop image optimized. Size reduction: ${((req.file.size - uploadBuffer.length) / 1024).toFixed(2)} KB`);
        } catch (sharpError) {
          console.error('❌ Sharp optimization failed:', sharpError.message);
        }
      }

      // Upload to Cloudflare R2 with automatic cleanup of old image
      const uploadResult = await uploadToR2WithCleanup(
        uploadBuffer,
        uploadFilename,
        uploadMimetype,
        'shops',
        oldImageUrl
      );

      if (uploadResult.success) {
        console.log('✅ Shop image uploaded to R2:', uploadResult.url);

        // Test if the uploaded file is accessible
        try {
          const https = require('https');
          const testUrl = uploadResult.url;

          console.log('🧪 Testing R2 file accessibility:', testUrl);

          https.get(testUrl, (res) => {
            console.log('🧪 R2 Access Test - Status:', res.statusCode);
            if (res.statusCode === 200) {
              console.log('✅ R2 file is publicly accessible');
            } else {
              console.log('⚠️ R2 file access returned status:', res.statusCode);
            }
          }).on('error', (err) => {
            console.log('⚠️ R2 access test failed:', err.message);
          });

        } catch (testErr) {
          console.log('⚠️ Could not test R2 accessibility:', testErr.message);
        }

        res.json({ imageUrl: uploadResult.url });
        return;
      } else {
        console.warn('⚠️ R2 upload failed, falling back to local storage:', uploadResult.error);
      }
    } else {
      console.log('📁 R2 not configured, using local storage fallback');
    }

    // Fallback to local storage
    const filename = `shopImage-${Date.now()}${path.extname(req.file.originalname)}`;
    const filepath = path.join(uploadsDir, filename);

    console.log('💾 Saving to local storage:', filepath);

    // Write buffer to file
    fs.writeFileSync(filepath, req.file.buffer);

    // Construct the URL for the uploaded image
    const imageUrl = `/Uploads/${filename}`;

    console.log('✅ Shop image saved locally:', imageUrl);
    res.json({ imageUrl });
  } catch (err) {
    console.error('❌ Error uploading shop image:', err);
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
});

// @route   GET api/shop/services/:userId
// @desc    Get services for a specific barber
// @access  Private
router.get('/services/:userId', auth, async (req, res) => {
  try {
    const shop = await Shop.findOne({ owner: req.params.userId });
    if (!shop) {
      return res.status(404).json({ msg: 'Shop not found for this barber.' });
    }
    res.json(shop.services);
  } catch (err) {
    console.error('Error fetching services by user ID:', err);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/shop/staff
// @desc    Add staff member to shop (only owner can do this)
// @access  Private
router.post('/staff', auth, async (req, res) => {
  const { staffId } = req.body;

  try {
    const shop = await Shop.findOne({ owner: req.user.id });

    if (!shop) {
      return res.status(404).json({ msg: 'Shop not found' });
    }

    // Check if the staff member is already in the staff array
    if (shop.staff.includes(staffId)) {
      return res.status(400).json({ msg: 'Staff member already added to this shop' });
    }

    // Check if the staff member exists and is a barber
    const User = require('../models/User');
    const staffUser = await User.findById(staffId);
    if (!staffUser || staffUser.role !== 'barber') {
      return res.status(400).json({ msg: 'Invalid staff member - must be a barber' });
    }

    // Check if the staff member already owns a shop
    const existingShop = await Shop.findOne({ owner: staffId });
    if (existingShop) {
      return res.status(400).json({ msg: 'Staff member already owns a shop' });
    }

    // Check if the staff member is already staff at another shop
    const otherShop = await Shop.findOne({ staff: staffId });
    if (otherShop) {
      return res.status(400).json({ msg: 'Staff member is already working at another shop' });
    }

    shop.staff.push(staffId);
    await shop.save();

    res.json({ success: true, msg: 'Staff member added successfully', shop });
  } catch (err) {
    console.error('Error adding staff:', err);
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
});

// @route   DELETE api/shop/staff/:staffId
// @desc    Remove staff member from shop (owner or the staff themselves can do this)
// @access  Private
router.delete('/staff/:staffId', auth, async (req, res) => {
  try {
    let shop = await Shop.findOne({ owner: req.user.id });

    if (!shop) {
      // Check if user is staff at a shop
      shop = await Shop.findOne({ staff: req.user.id });
      if (!shop) {
        return res.status(404).json({ msg: 'Shop not found' });
      }
      // If user is staff, check if they are removing themselves
      if (req.user.id !== req.params.staffId) {
        return res.status(401).json({ msg: 'Staff can only remove themselves' });
      }
    } else {
      // User is owner, can remove any staff
    }

    // Remove the staff member from the staff array
    shop.staff = shop.staff.filter(id => id.toString() !== req.params.staffId);
    await shop.save();

    res.json({ success: true, msg: 'Staff member removed successfully', shop });
  } catch (err) {
    console.error('Error removing staff:', err);
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
});

// @route   GET api/shop/staff
// @desc    Get staff members for current user's shop
// @access  Private
router.get('/staff', auth, async (req, res) => {
  try {
    const shop = await Shop.findOne({ owner: req.user.id }).populate('staff', 'name email phone profilePicture');

    if (!shop) {
      return res.status(404).json({ msg: 'Shop not found' });
    }

    res.json(shop.staff);
  } catch (err) {
    console.error('Error fetching staff:', err);
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
});

// @route   DELETE api/shop
// @desc    Delete user's shop (only if no staff)
// @access  Private
router.delete('/', auth, async (req, res) => {
  try {
    const shop = await Shop.findOne({ owner: req.user.id });

    if (!shop) {
      return res.status(404).json({ msg: 'Shop not found' });
    }

    if (shop.staff.length > 0) {
      return res.status(400).json({ msg: 'Cannot delete shop while there are staff members' });
    }

    // Delete the shop
    await Shop.findByIdAndDelete(shop._id);

    res.json({ success: true, msg: 'Shop deleted successfully' });
  } catch (err) {
    console.error('Error deleting shop:', err);
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
});

router.put('/force-encrypt-all', async (req, res) => {
  try {
    const shops = await Shop.find({});
    let count = 0;

    for (const shop of shops) {
      // We mark fields as modified to force Mongoose to run setters (encryption)
      shop.markModified('name');
      shop.markModified('address');
      shop.markModified('phone');

      // If originalData exists and has plain text, re-set it to trigger encryption
      if (shop.originalData && typeof shop.originalData.name === 'string') {
        // Temporarily hold data
        const temp = { ...shop.originalData };
        // Re-assigning triggers the new Schema setters
        shop.originalData = temp;
        shop.markModified('originalData');
      }

      await shop.save();
      count++;
    }
    res.json({ msg: `Successfully re-encrypted ${count} shops.` });
  } catch (err) {
    console.error(err);
    res.status(500).send(err.message);
  }
});

module.exports = router;
// @route   PUT api/shop/staff/approve/:barberId
// @desc    Approve a staff member (Shop Owner Only) - Moves to pending_admin_approval
// @access  Private (Owner)
router.put('/staff/approve/:barberId', auth, async (req, res) => {
  try {
    // 1. Find the BarberCard
    const barberCard = await BarberCard.findOne({ barberId: req.params.barberId });
    if (!barberCard) {
      return res.status(404).json({ msg: 'Staff request not found' });
    }

    // 2. Verify Shop Ownership
    const shop = await Shop.findOne({ owner: req.user.id });
    if (!shop) {
      return res.status(403).json({ msg: 'You do not own a shop' });
    }

    if (barberCard.shopId.toString() !== shop._id.toString()) {
      return res.status(403).json({ msg: 'This staff member has not requested to join your shop' });
    }

    // 3. Check current status
    if (barberCard.approvalStatus !== 'pending_owner_approval') {
      return res.status(400).json({ msg: `Cannot approve. Current status is: ${barberCard.approvalStatus}` });
    }

    // 4. Update Status
    barberCard.approvalStatus = 'pending_admin_approval';
    await barberCard.save();

    res.json({ success: true, msg: 'Staff approved by owner. Now pending admin approval.', barberCard });
  } catch (err) {
    console.error('Error approving staff:', err);
    res.status(500).json({ msg: 'Server Error' });
  }
});

// @route   PUT api/shop/staff/reject/:barberId
// @desc    Reject a staff member (Shop Owner Only)
// @access  Private (Owner)
router.put('/staff/reject/:barberId', auth, async (req, res) => {
  try {
    const { reason } = req.body;

    // 1. Find the BarberCard
    const barberCard = await BarberCard.findOne({ barberId: req.params.barberId });
    if (!barberCard) {
      return res.status(404).json({ msg: 'Staff request not found' });
    }

    // 2. Verify Shop Ownership
    const shop = await Shop.findOne({ owner: req.user.id });
    if (!shop || barberCard.shopId.toString() !== shop._id.toString()) {
      return res.status(403).json({ msg: 'Unauthorized' });
    }

    // 3. Update Status
    barberCard.approvalStatus = 'rejected';
    barberCard.rejectionReason = reason || 'Rejected by shop owner';
    await barberCard.save();

    // 4. Optionally remove from Shop.staff array?
    // Current logic in auth.js adds them to Shop.staff implicitly. We might want to remove them here.
    shop.staff = shop.staff.filter(id => id.toString() !== req.params.barberId);
    await shop.save();

    res.json({ success: true, msg: 'Staff request rejected', barberCard });
  } catch (err) {
    console.error('Error rejecting staff:', err);
    res.status(500).json({ msg: 'Server Error' });
  }
});

// @route   GET api/shop/staff/pending
// @desc    Get pending staff requests for the current user's shop
// @access  Private (Owner)
router.get('/staff/pending', auth, async (req, res) => {
  try {
    const shop = await Shop.findOne({ owner: req.user.id });
    if (!shop) {
      return res.status(404).json({ msg: 'Shop not found' });
    }

    const pendingStaff = await BarberCard.find({
      shopId: shop._id,
      approvalStatus: 'pending_owner_approval'
    }).populate('barberId', 'name email phone profilePicture');

    res.json(pendingStaff);
  } catch (err) {
    console.error('Error fetching pending staff:', err);
    res.status(500).json({ msg: 'Server Error' });
  }
});
