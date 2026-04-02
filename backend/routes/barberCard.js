const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const auth = require('../middleware/auth');
const redisCache = require('../middleware/redisCache');
const BarberCard = require('../models/BarberCard');
const BarberCardDeleteRequest = require('../models/BarberCardDeleteRequest');
const Shop = require('../models/Shop');
const User = require('../models/User');
const Review = require('../models/Review');
const Service = require('../models/Service');
const Booking = require('../models/Booking');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const { uploadToR2, extractKeyFromUrl, uploadToR2WithCleanup } = require('../utils/r2Storage');
const { decryptObject } = require('../utils/EncryptionService');
const validate = require('../middleware/validate');
const schemas = require('../utils/validationSchemas');

// Simple in-memory cache for barber card data (use Redis in production)
const barberCardCache = new Map();
const BARBER_CARD_CACHE_DURATION = 60 * 1000; // 1 minute (for real-time booking counts)

const getCached = (key) => {
  const cached = barberCardCache.get(key);
  if (cached && Date.now() - cached.timestamp < BARBER_CARD_CACHE_DURATION) {
    return cached.data;
  }
  barberCardCache.delete(key);
  return null;
};

const setCached = (key, data) => {
  barberCardCache.set(key, { data, timestamp: Date.now() });
  // Prevent memory leaks - limit cache size
  if (barberCardCache.size > 200) {
    const firstKey = barberCardCache.keys().next().value;
    barberCardCache.delete(firstKey);
  }
};

// Ensure the uploads directory exists
const uploadsDir = path.join(__dirname, '../../barber-app/Uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Set up multer for file uploads (memory storage for R2)
const storage = multer.memoryStorage();
const upload = multer({ storage });

// @route   POST api/barber-card
// @desc    Create a new barber card
// @access  Private
router.post('/', auth, validate(schemas.createBarberCard), async (req, res) => {
  const { name, services, specialties, categoryOrder, avgAppointmentTime, isAvailable } = req.body;

  try {
    // Check if user already has a barber card
    const existingCard = await BarberCard.findOne({ barberId: req.user.id });
    if (existingCard) {
      return res.status(400).json({ msg: 'You already have a barber card' });
    }

    // Check if user is owner or staff at a shop
    let shop = await Shop.findOne({ owner: req.user.id });
    if (!shop) {
      shop = await Shop.findOne({ staff: req.user.id });
    }
    // Temporarily allow creating without shop for testing
    // if (!shop) {
    //   return res.status(400).json({ msg: 'You must be associated with a shop to create a barber card' });
    // }

    // Calculate total appointment time from services if not provided
    let calculatedAvgTime = avgAppointmentTime;
    if (!calculatedAvgTime && services && services.length > 0) {
      const totalTime = services.reduce((sum, service) => sum + parseInt(service.time || 0), 0);
      calculatedAvgTime = `${totalTime} min`;
    } else if (!calculatedAvgTime) {
      calculatedAvgTime = '30 min';
    }

    // Filter out inherited services if they were sent by mistake
    const filteredServices = (services || []).filter(s => !s.isInherited && s.source !== 'shop');

    const barberCard = new BarberCard({
      barberId: req.user.id,
      shopId: shop ? shop._id : null, // Assuming 'user.shopId' was a typo and should use the 'shop' object found
      name,
      services: filteredServices,
      specialties: specialties || [],
      categoryOrder: categoryOrder || [],
      avgAppointmentTime: calculatedAvgTime,
      isAvailable: isAvailable !== undefined ? isAvailable : true,
      image: req.body.image || null,
      approvalStatus: 'pending', // New cards start as pending approval
    });

    // Handle maxAppointments update (Directly to User model)
    const maxAppts = req.body.maxAppointments || req.body.maxAppointmentsPerDay;
    if (maxAppts !== undefined) {
      await User.findByIdAndUpdate(req.user.id, { maxAppointmentsPerDay: parseInt(maxAppts) });
      console.log(`✅ Updated maxAppointmentsPerDay for user ${req.user.id} to ${maxAppts} during creation`);
    }

    if (req.body.concurrentServiceCapacity !== undefined) {
      await User.findByIdAndUpdate(req.user.id, { concurrentServiceCapacity: parseInt(req.body.concurrentServiceCapacity) });
      console.log(`✅ Updated concurrentServiceCapacity for user ${req.user.id} to ${req.body.concurrentServiceCapacity}`);
    }

    await barberCard.save();

    // --- NEW: OWNER-TO-SHOP MASTER SYNC (on Creation) ---
    try {
      if (shop && (shop.owner?.toString() === req.user.id || shop.owner === req.user.id)) {
        console.log(`🔄 Initial sync of owner services to Shop Master List for shop ${shop._id}`);
        shop.services = (req.body.services || []).map(s => ({
          id: s.serviceId || s.id || Date.now().toString(),
          name: s.name,
          price: s.price,
          time: s.time,
          category: s.category || 'General',
          barberId: req.user.id
        }));
        await shop.save();
        console.log(`✅ Shop Master List initialized with ${shop.services.length} services`);
      }
    } catch (syncErr) {
      console.warn('⚠️ Initial service sync to shop failed:', syncErr.message);
    }
    // ----------------------------------------------------

    res.json(barberCard);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/barber-card/my-card
// @desc    Get current user's barber card
// @access  Private
router.get('/my-card', auth, async (req, res) => {
  try {
    let barberCard = await BarberCard.findOne({ barberId: req.user.id }).lean();
    if (!barberCard) {
      return res.status(404).json({ msg: 'Barber card not found' });
    }

    // --- Centralized Service Sync Injection ---
    if (barberCard.shopId) {
      const shop = await Shop.findById(barberCard.shopId).select('forceStaffServiceSync services');
      if (shop && shop.forceStaffServiceSync && shop.services && shop.services.length > 0) {
        // Already a plain object due to .lean()
        const cardObj = barberCard;
        // Inject shop services that aren't already in the barber card
        const shopServices = shop.services.map(s => {
          const sObj = s.toObject ? s.toObject() : s;
          const sId = sObj.serviceId || sObj.id; // Normalize ID field
          return {
            ...sObj,
            serviceId: sId,
            id: sId?.toString(), // Ensure both are present for compatibility
            source: 'shop',
            isInherited: true
          };
        });

        const existingServiceIdsArr = (cardObj.services || []).map(s => s.serviceId?.toString()).filter(Boolean);
        const existingServiceIds = new Set(existingServiceIdsArr);

        // For simplicity and to avoid storage issues, if sync is FORCED, we can either:
        // 1. Append (if they haven't added them)
        // 2. Clear and strictly use shop services
        // The user said "all services will be synced... no more again 50 services adding required"
        // So we strictly use Shop services if sync is forced, but maybe keep barber personal ones too?
        // Let's go with Merging: Shop services take priority or are added.

        const mergedServices = [...cardObj.services];
        shopServices.forEach(ss => {
          if (!existingServiceIds.has(ss.serviceId?.toString())) {
            mergedServices.push(ss);
          }
        });

        cardObj.services = mergedServices;
        barberCard = cardObj;
      }
    }
    // ------------------------------------------

    // 1. Decrypt entire object for staff/owner view
    const result = decryptObject(barberCard);

    // Prevent caching to ensuring "pending" updates are seen immediately
    res.set('Cache-Control', 'no-store');
    res.json(result);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/barber-card
// @desc    Update user's barber card
// @access  Private
router.put('/', auth, validate(schemas.updateBarberCard), async (req, res) => {
  const { name, services, specialties, categoryOrder, avgAppointmentTime, isAvailable, image } = req.body;

  try {
    let barberCard = await BarberCard.findOne({ barberId: req.user.id });

    if (!barberCard) {
      return res.status(404).json({ msg: 'Barber card not found' });
    }

    // --- GRANULAR LOCKDOWN CHECK ---
    // If shop sync is enabled, staff cannot edit Services or Category Order. 
    // However, they CAN edit their personal details (Name, Image, Slots, etc.)
    const shop = await Shop.findById(barberCard.shopId);
    const isOwner = shop && (shop.owner?.toString() === req.user.id || shop.owner === req.user.id);

    if (shop && shop.forceStaffServiceSync && !isOwner) {
      // Logic: Only block if they are actually trying to CHANGE these restricted fields.
      // We filter out inherited services from the request to compare against the stored ones.
      const requestedPersonalServices = (services || []).filter(s => !s.isInherited && s.source !== 'shop');

      const isChangingServices = services !== undefined && JSON.stringify(requestedPersonalServices) !== JSON.stringify(barberCard.services);
      const isChangingOrder = categoryOrder !== undefined && JSON.stringify(categoryOrder) !== JSON.stringify(barberCard.categoryOrder);

      if (isChangingServices || isChangingOrder) {
        console.log(`🚫 Service Lockdown: Staff ${req.user.id} attempted to MODIFIED services/order while sync is enabled`);
        return res.status(403).json({
          msg: 'Service management is locked. Only the shop owner can modify the Service Menu and Category Order when Centralized Sync is enabled.',
          isServiceLocked: true
        });
      }
    }
    // -------------------------------

    // Store original data if this is the first time going to pending
    if (barberCard.approvalStatus === 'approved') {
      barberCard.originalData = {
        name: barberCard.name,
        services: barberCard.services,
        specialties: barberCard.specialties,
        avgAppointmentTime: barberCard.avgAppointmentTime,
        isAvailable: barberCard.isAvailable,
        image: barberCard.image,
      };

      // CRITICAL FIX: Explicitly clear any stale pending/change data from previous sessions
      // This ensures we start with a clean slate for the new request
      barberCard.pendingChanges = {};
      barberCard.changeDetails = [];
    }

    // Initialize pendingChanges and changeDetails
    barberCard.pendingChanges = barberCard.pendingChanges || {};
    barberCard.changeDetails = barberCard.changeDetails || [];

    // Track changes
    const changes = [];

    // List of fields that trigger admin approval
    let anyApprovalRequiredChange = false;

    if (name !== undefined && name !== barberCard.name) {
      barberCard.pendingChanges.name = name;
      anyApprovalRequiredChange = true;
      changes.push({
        field: 'name',
        oldValue: barberCard.name,
        newValue: name,
        description: `Name changed from "${barberCard.name}" to "${name}"`
      });
    }

    if (categoryOrder !== undefined) {
      // Direct update, no approval needed for organization
      barberCard.categoryOrder = categoryOrder;
      console.log(`⚡ Category order updated for barber card ${barberCard._id}`);
    }

    if (services !== undefined) {
      // STRIP INHERITED SERVICES: We only save services that are specific to the barber
      // Inherited services are injected dynamically on read.
      const filteredServices = services.filter(s => !s.isInherited && s.source !== 'shop');

      barberCard.services = filteredServices;
      // Mark as modified since it's an array
      barberCard.markModified('services');
      console.log(`⚡ Services updated directly for barber card ${barberCard._id} (filtered ${services.length} -> ${filteredServices.length})`);

      // --- NEW: OWNER-TO-SHOP MASTER SYNC ---
      // If the user is the owner, push these services to the Shop master list
      try {
        const shop = await Shop.findById(barberCard.shopId);
        if (shop && (shop.owner?.toString() === req.user.id || shop.owner === req.user.id)) {
          console.log(`🔄 Syncing owner services to Shop Master List for shop ${shop._id}`);

          // Map incoming services to shop service format
          shop.services = services.map(s => ({
            id: s.serviceId || s.id || Date.now().toString(),
            name: s.name,
            price: s.price,
            time: s.time,
            category: s.category || 'General',
            barberId: req.user.id
          }));

          await shop.save();
          console.log(`✅ Shop Master List updated with ${shop.services.length} services`);
        }
      } catch (syncErr) {
        console.warn('⚠️ Service sync to shop failed:', syncErr.message);
      }
      // ----------------------------------------
    }

    if (specialties !== undefined) {
      barberCard.pendingChanges.specialties = specialties;
      anyApprovalRequiredChange = true;
      changes.push({
        field: 'specialties',
        oldValue: barberCard.specialties,
        newValue: specialties,
        description: `Specialties updated from [${barberCard.specialties?.join(', ') || ''}] to [${specialties.join(', ')}]`
      });
    }

    if (isAvailable !== undefined && isAvailable !== barberCard.isAvailable) {
      barberCard.pendingChanges.isAvailable = isAvailable;
      anyApprovalRequiredChange = true;
      changes.push({
        field: 'isAvailable',
        oldValue: barberCard.isAvailable,
        newValue: isAvailable,
        description: `Availability changed from ${barberCard.isAvailable ? 'available' : 'unavailable'} to ${isAvailable ? 'available' : 'unavailable'}`
      });
    }

    if (image !== undefined && image !== barberCard.image) {
      barberCard.pendingChanges.image = image;
      anyApprovalRequiredChange = true;
      changes.push({
        field: 'image',
        oldValue: barberCard.image,
        newValue: image,
        description: 'Profile image updated'
      });
    }

    // Handle avgAppointmentTime
    let newAvgTime = barberCard.avgAppointmentTime;
    if (services || avgAppointmentTime) {
      if (avgAppointmentTime) {
        newAvgTime = avgAppointmentTime;
      } else if (services && services.length > 0) {
        const totalTime = services.reduce((sum, service) => sum + parseInt(service.time || 0), 0);
        newAvgTime = `${totalTime} min`;
      }
    }

    if (newAvgTime !== barberCard.avgAppointmentTime) {
      // DIRECT UPDATE: Avg time is derived from services or set directly, no approval needed
      barberCard.avgAppointmentTime = newAvgTime;
      console.log(`⚡ Average time updated directly to ${newAvgTime}`);
    }

    // Handle maxAppointments update (Directly to User model - No Approval needed)
    const maxAppts = req.body.maxAppointments || req.body.maxAppointmentsPerDay;
    if (maxAppts !== undefined) {
      await User.findByIdAndUpdate(req.user.id, { maxAppointmentsPerDay: parseInt(maxAppts) });
      console.log(`✅ Updated maxAppointmentsPerDay for user ${req.user.id} to ${maxAppts}`);
    }

    if (req.body.concurrentServiceCapacity !== undefined) {
      await User.findByIdAndUpdate(req.user.id, { concurrentServiceCapacity: parseInt(req.body.concurrentServiceCapacity) });
      console.log(`✅ Updated concurrentServiceCapacity for user ${req.user.id} to ${req.body.concurrentServiceCapacity}`);
    }

    // Add new changes to changeDetails
    // CRITICAL FIX: Allow "merging" updates. If a field is updated multiple times while pending,
    // remove the old log for that field and replace it with the new one (Original -> Latest).
    if (barberCard.changeDetails && barberCard.changeDetails.length > 0) {
      const fieldsBeingUpdated = changes.map(c => c.field);
      barberCard.changeDetails = barberCard.changeDetails.filter(
        detail => !fieldsBeingUpdated.includes(detail.field)
      );
    }

    barberCard.changeDetails.push(...changes);

    // Only set approval status to pending if fields requiring approval were actually changed
    if (anyApprovalRequiredChange) {
      const oldStatus = barberCard.approvalStatus;
      barberCard.approvalStatus = 'pending';
      console.log(`🔄 Updating barber card ${barberCard._id} - changing status from '${oldStatus}' to 'pending' due to sensitive changes`);
    } else {
      console.log(`⚡ Direct updates only (services/capacity) for barber card ${barberCard._id} - maintaining status: ${barberCard.approvalStatus}`);
    }
    console.log(`📝 Change details:`, changes);
    console.log(`💾 Pending changes:`, barberCard.pendingChanges);

    // Verify markModified is called for Mixed type updates
    barberCard.markModified('pendingChanges');

    await barberCard.save();
    console.log(`Barber card ${barberCard._id} updated successfully with status: ${barberCard.approvalStatus}`);
    res.json({
      barberCard,
      changes: changes,
      pendingChanges: barberCard.pendingChanges,
      changeDetails: barberCard.changeDetails
    });
  } catch (err) {
    next(err);
  }
});

// @route   GET api/barber-card/all
// @desc    Get all barber cards (HEAVILY OPTIMIZED - 1 min cache for real-time availability)
// @access  Public
router.get('/all', redisCache(60), async (req, res) => {
  try {
    const { category, shopId, page, limit } = req.query;
    const cacheKey = `barber_all_${category || 'all'}_${shopId || 'all'}_${page || 1}_${limit || 0}`;
    const cached = getCached(cacheKey);
    if (cached) {
      res.set('Cache-Control', 'public, max-age=60');
      return res.json(cached);
    }

    let filter = {};

    // --- SUBSCRIPTION GATING REMOVED ---
    // Listings are free for all approved barbers.
    // -----------------------------------

    if (shopId) {
      filter.shopId = shopId;
    } else if (category) {
      const shops = await Shop.find({ category: { $in: category.split(',') } });
      const shopIds = shops.map(shop => shop._id);
      filter.shopId = { $in: shopIds };
    }

    // Ensure only approved barber cards are returned
    filter.approvalStatus = 'approved';

    // 1. Pagination Setup
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 0;
    const skip = limitNum > 0 ? (pageNum - 1) * limitNum : 0;

    // 2. Fetch Cards with Pagination
    console.log('Fetching barber cards with filter:', filter);
    let query = BarberCard.find(filter)
      .select('-pendingChanges -changeDetails') // Exclude heavy auditing/change data
      .populate('barberId', 'name profilePicture rating reviews maxAppointmentsPerDay todaysBookings isAvailable')
      .populate('shopId', 'name address category tag isAvailable forceStaffServiceSync services operatingHours')
      .sort({ createdAt: -1 })
      .lean();

    if (limitNum > 0) {
      query = query.skip(skip).limit(limitNum);
    }

    const barberCardsRaw = await query;
    // Decrypt plain objects recursively to restore name/services/etc.
    const cleanCards = decryptObject(barberCardsRaw);

    // Filter out cards where the associated barber user has been deleted
    const barberCards = cleanCards.filter(card => card.barberId);

    // 3. Batch Fetch Reviews (Solving N+1 Problem)
    const barberIds = barberCards.map(card => card.barberId._id);

    const reviewsAggregation = await Review.aggregate([
      { $match: { barberId: { $in: barberIds } } },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: "$barberId",
          reviews: { $push: "$$ROOT" },
          count: { $sum: 1 },
          avgRating: { $avg: "$rating" }
        }
      },
      {
        $project: {
          reviews: { $slice: ["$reviews", 3] },
          count: 1,
          avgRating: 1
        }
      }
    ]);

    await Review.populate(reviewsAggregation, { path: 'reviews.userId', select: 'name' });

    const reviewsMap = new Map();
    reviewsAggregation.forEach(item => {
      reviewsMap.set(item._id.toString(), item);
    });

    // 3.5 Batch Fetch Booking Counts (Solving N+1 Problem for Availability)
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);

    const bookingsAggregation = await Booking.aggregate([
      {
        $match: {
          barberId: { $in: barberIds },
          date: { $gte: today, $lt: tomorrow },
          $or: [
            { status: { $in: ['completed', 'started'] } },
            { paymentStatus: 'completed', status: { $ne: 'cancelled' } },
            { paymentStatus: 'pending', status: { $in: ['confirmed', 'pending'] }, createdAt: { $gte: tenMinutesAgo } }
          ]
        }
      },
      {
        $group: {
          _id: "$barberId",
          count: { $sum: 1 }
        }
      }
    ]);

    const bookingsCountMap = new Map();
    bookingsAggregation.forEach(item => {
      bookingsCountMap.set(item._id.toString(), item.count);
    });

    // 4. Construct Final Data
    const barberCardsWithBookings = barberCards.map((card) => {
      const reviewData = reviewsMap.get(card.barberId._id.toString());

      const reviews = reviewData ? reviewData.reviews : [];
      const reviewCount = reviewData ? reviewData.count : 0;
      const averageRating = reviewData ? reviewData.avgRating : (card.rating || card.barberId.rating || 0);

      let services = card.services || [];
      if (card.shopId && card.shopId.forceStaffServiceSync && card.shopId.services && card.shopId.services.length > 0) {
        const existingServiceIdsArr = (services || []).map(s => s.serviceId?.toString()).filter(Boolean);
        const existingServiceIds = new Set(existingServiceIdsArr);

        const shopServices = card.shopId.services.map(s => {
          const sObj = s; // Already plain
          const sId = sObj.serviceId || sObj.id;
          return {
            ...sObj,
            serviceId: sId,
            id: sId?.toString(),
            source: 'shop',
            isInherited: true
          };
        });

        const mergedServices = [...services];
        shopServices.forEach(ss => {
          const ssIdStr = ss.serviceId?.toString();
          if (ssIdStr && !existingServiceIds.has(ssIdStr)) {
            mergedServices.push(ss);
          }
        });
        services = mergedServices;
      }

      const currentBookings = bookingsCountMap.get(card.barberId._id.toString()) || 0;
      const isFullyBooked = currentBookings >= (card.barberId.maxAppointmentsPerDay || 10);

      return {
        ...card, // card is already the _id-containing object
        id: card._id,
        barberId: card.barberId._id,
        name: card.name,
        address: card.shopId ? card.shopId.address : 'No address',
        image: {
          uri: card.image || card.barberId.profilePicture || 'https://via.placeholder.com/150',
        },
        rawImage: card.image, // Raw barber card image from database
        rating: averageRating,
        reviewCount: reviewCount,
        services: services,
        category: card.shopId ? card.shopId.category : 'General',
        tag: card.specialties?.[0] || (card.shopId ? card.shopId.tag : 'Barber'),
        avgAppointmentTime: card.avgAppointmentTime,
        totalServices: services.length,
        isAvailable: card.barberId.isAvailable,
        todaysBookings: currentBookings,
        isFullyBooked: isFullyBooked,
        shopName: card.shopId ? card.shopId.name : 'Independent',
        operatingHours: card.shopId ? card.shopId.operatingHours : null,
        listingTier: 'Basic',
        reviews,
        approvalStatus: card.approvalStatus, // Include approval status for UI indicators
      };
    });
    
    // Deep Decrypt the final results to be 100% sure nothing is left encrypted
    const finalResults = decryptObject(barberCardsWithBookings);

    // Prevent caching of approval-sensitive data
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });

    // --- NEW: Hydrate Categories for All Cards (for Icons/Colors consistency) ---
    const allServiceIdsRaw = [...new Set(finalResults.flatMap(card => card.services?.map(s => s.serviceId) || []))].filter(Boolean);
    // CRITICAL FIX: Only query valid Mongoose ObjectIds to prevent 500 crashes
    const allServiceIds = allServiceIdsRaw.filter(id => mongoose.Types.ObjectId.isValid(id?.toString()));

    if (allServiceIds.length > 0) {
      const masterServices = await Service.find({ _id: { $in: allServiceIds } });
      finalResults.forEach(card => {
        if (card.services) {
          card.services = card.services.map(s => {
            const ms = masterServices.find(m => m._id.toString() === s.serviceId?.toString());
            return {
              ...s,
              category: s.category || ms?.category || 'General'
            };
          });
        }
      });
    }

    res.set('Cache-Control', 'public, max-age=60');
    res.json(finalResults);
  } catch (err) {
    next(err);
  }
});

// @route   PUT api/barber-card/increment-click/:cardId
// @desc    Increment click count for a barber card
// @access  Public
// @route   PUT api/barber-card/increment-click/:cardId
// @desc    Increment click count for a barber card (with IP deduplication)
// @access  Public
router.put('/increment-click/:cardId', async (req, res) => {
  try {
    const ClickLog = require('../models/ClickLog');
    const BarberCard = require('../models/BarberCard'); // Ensure model is loaded
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

    // Check if this IP has already clicked this card in the last 24 hours
    const existingClick = await ClickLog.findOne({
      targetId: req.params.cardId,
      targetType: 'barber',
      ip: ip
    });

    if (existingClick) {
      console.log(`Duplicate click prevented for barber card ${req.params.cardId} from IP ${ip}`);
      // Return success but DO NOT increment count
      const barberCard = await BarberCard.findById(req.params.cardId).select('clickCount');
      return res.json({ success: true, clickCount: barberCard ? barberCard.clickCount : 0, filtered: true });
    }

    const barberCard = await BarberCard.findById(req.params.cardId);

    if (!barberCard) {
      return res.status(404).json({ msg: 'Barber card not found' });
    }

    // Log the click
    await ClickLog.create({
      targetId: barberCard._id,
      targetType: 'barber',
      ip: ip,
      userAgent: req.headers['user-agent']
    });

    barberCard.clickCount = (barberCard.clickCount || 0) + 1;
    await barberCard.save();

    res.json({ success: true, clickCount: barberCard.clickCount });
  } catch (err) {
    console.error('Error incrementing click count:', err);
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
});

// @route   POST api/barber-card/upload-image
// @desc    Upload barber card image
// @access  Private
router.post('/upload-image', auth, upload.single('barberCardImage'), async (req, res) => {
  try {
    if (!req.file) {
      console.log('❌ Barber card upload: No file uploaded');
      return res.status(400).json({ msg: 'No file uploaded' });
    }

    console.log('📤 Barber card upload: File received:', {
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

    // Get current barber card to find existing image for cleanup
    let currentBarberCard = null;
    try {
      currentBarberCard = await BarberCard.findOne({ barberId: req.user.id });
    } catch (dbErr) {
      console.log('⚠️ Could not fetch current barber card for cleanup:', dbErr.message);
    }

    const oldImageUrl = currentBarberCard?.image;

    if (isR2Configured) {
      console.log('☁️ Attempting upload to Cloudflare R2 with cleanup...');
      console.log('📋 Old image URL for cleanup:', oldImageUrl);

      let uploadBuffer = req.file.buffer;
      let uploadFilename = req.file.originalname;
      let uploadMimetype = req.file.mimetype;

      // Optimize Image
      if (req.file.mimetype.startsWith('image')) {
        console.log(`🖼️ Optimizing barber card image: ${req.file.originalname}`);
        try {
          uploadBuffer = await sharp(req.file.buffer)
            .rotate() // Auto-rotate based on EXIF data
            .resize({ width: 1280, withoutEnlargement: true })
            .webp({ quality: 80 })
            .toBuffer();

          uploadFilename = `${path.parse(req.file.originalname).name}.webp`;
          uploadMimetype = 'image/webp';
          console.log(`✅ Barber card image optimized. Size reduction: ${((req.file.size - uploadBuffer.length) / 1024).toFixed(2)} KB`);
        } catch (sharpError) {
          console.error('❌ Sharp optimization failed:', sharpError.message);
        }
      }

      // Upload to Cloudflare R2 with automatic cleanup of old image
      const uploadResult = await uploadToR2WithCleanup(
        uploadBuffer,
        uploadFilename,
        uploadMimetype,
        'barber-cards',
        oldImageUrl
      );

      if (uploadResult.success) {
        console.log('✅ Barber card image uploaded to R2:', uploadResult.url);

        // Test if the uploaded file is accessible
        try {
          const https = require('https');
          const testUrl = uploadResult.url;

          console.log('🧪 Testing barber card R2 file accessibility:', testUrl);

          https.get(testUrl, (res) => {
            console.log('🧪 Barber card R2 Access Test - Status:', res.statusCode);
            if (res.statusCode === 200) {
              console.log('✅ Barber card R2 file is publicly accessible');
            } else {
              console.log('⚠️ Barber card R2 file access returned status:', res.statusCode);
            }
          }).on('error', (err) => {
            console.log('⚠️ Barber card R2 access test failed:', err.message);
          });

        } catch (testErr) {
          console.log('⚠️ Could not test barber card R2 accessibility:', testErr.message);
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
    const filename = `barberCardImage-${Date.now()}${path.extname(req.file.originalname)}`;
    const filepath = path.join(uploadsDir, filename);

    console.log('💾 Saving to local storage:', filepath);

    // Write buffer to file
    fs.writeFileSync(filepath, req.file.buffer);

    // Construct the URL for the uploaded image
    const imageUrl = `/Uploads/${filename}`;

    console.log('✅ Barber card image saved locally:', imageUrl);
    res.json({ imageUrl });
  } catch (err) {
    console.error('❌ Error uploading barber card image:', err);
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
});

// @route   GET api/barber-card/services
// @desc    Get all active services for customers to browse and barbers to select from
// @access  Public
router.get('/services', async (req, res) => {
  try {
    const { shopId } = req.query;
    let query = { isActive: true };

    if (shopId) {
      query.shopId = shopId;
    } else {
      // If no shopId, return empty list (or handle appropriately)
      return res.json([]);
    }

    const services = await Service.find(query).sort({ name: 1 });
    res.json(services);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/barber-card/:id
// @desc    Get a specific barber card by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const barberCard = await BarberCard.findById(req.params.id)
      .populate('barberId', 'profilePicture rating reviews maxAppointmentsPerDay todaysBookings isAvailable')
      .populate('shopId', 'name address category tag isAvailable forceStaffServiceSync services operatingHours');

    if (!barberCard) {
      return res.status(404).json({ msg: 'Barber card not found' });
    }

    // Get reviews for this barber
    const reviewsAggregation = await Review.aggregate([
      { $match: { barberId: barberCard.barberId._id } },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: "$barberId",
          reviews: { $push: "$$ROOT" },
          count: { $sum: 1 },
          avgRating: { $avg: "$rating" }
        }
      },
      {
        $project: {
          reviews: { $slice: ["$reviews", 3] },
          count: 1,
          avgRating: 1
        }
      }
    ]);

    await Review.populate(reviewsAggregation, { path: 'reviews.userId', select: 'name' });

    const reviewData = reviewsAggregation[0] || { reviews: [], count: 0, avgRating: 0 };

    // Construct the response similar to the /all route
    const barberCardWithDetails = {
      id: barberCard._id,
      barberId: barberCard.barberId._id,
      name: barberCard.name,
      address: barberCard.shopId ? barberCard.shopId.address : 'No address',
      image: barberCard.image || barberCard.barberId.profilePicture || 'https://via.placeholder.com/150',
      rating: reviewData.avgRating || barberCard.rating || 0,
      reviewCount: reviewData.count,
      services: [], // Placeholder for now
      category: barberCard.shopId ? barberCard.shopId.category : 'General',
      tag: barberCard.specialties?.[0] || (barberCard.shopId ? barberCard.shopId.tag : 'Barber'),
      avgAppointmentTime: barberCard.avgAppointmentTime,
      totalServices: barberCard.services?.length || 0,
      isAvailable: barberCard.barberId.isAvailable,
      todaysBookings: barberCard.barberId.todaysBookings || 0,
      shopName: barberCard.shopId ? barberCard.shopId.name : 'Independent',
      operatingHours: barberCard.shopId ? barberCard.shopId.operatingHours : null,
      listingTier: 'Basic',
      reviews: reviewData.reviews,
      approvalStatus: barberCard.approvalStatus,
    };

    // --- Dynamic Service Sync & Hydration ---
    let finalServices = barberCard.services ? barberCard.services.map(s => s.toObject ? s.toObject() : s) : [];

    const shop = barberCard.shopId;
    const isMainOwner = shop && (shop.owner?.toString() === barberCard.barberId._id?.toString());

    if (shop && shop.forceStaffServiceSync && !isMainOwner && shop.services?.length > 0) {
      // Inject shop master services for staff under sync
      finalServices = shop.services.map(s => {
        const sObj = s.toObject ? s.toObject() : s;
        const sId = sObj.serviceId || sObj.id;
        return {
          ...sObj,
          serviceId: sId,
          id: sId?.toString(),
          source: 'shop',
          isInherited: true
        };
      });
    }

    // Hydrate categories from master list if missing (for legacy or direct cards)
    // We do this by checking all services in finalServices
    const missingCats = finalServices.some(s => !s.category || s.category === 'General' || s.category === '');
    if (missingCats) {
      const sIdsRaw = finalServices.map(s => s.serviceId).filter(Boolean);
      const sIds = sIdsRaw.filter(id => mongoose.Types.ObjectId.isValid(id?.toString()));

      if (sIds.length > 0) {
        const masterServices = await Service.find({ _id: { $in: sIds } });
        finalServices = finalServices.map(s => {
          const ms = masterServices.find(m => m._id.toString() === s.serviceId?.toString());
          return {
            ...s,
            category: s.category || ms?.category || 'General'
          };
        });
      }
    }

    barberCardWithDetails.services = finalServices;
    barberCardWithDetails.totalServices = finalServices.length;

    // --- NEW: Real-time Availability Sync ---
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);

    const currentBookings = await Booking.countDocuments({
      barberId: barberCard.barberId._id,
      date: { $gte: today, $lt: tomorrow },
      $or: [
        { status: { $in: ['completed', 'started'] } },
        { paymentStatus: 'completed', status: { $ne: 'cancelled' } },
        { paymentStatus: 'pending', status: { $in: ['confirmed', 'pending'] }, createdAt: { $gte: tenMinutesAgo } }
      ]
    });

    barberCardWithDetails.todaysBookings = currentBookings;
    barberCardWithDetails.isFullyBooked = currentBookings >= (barberCard.barberId.maxAppointmentsPerDay || 10);
    // ----------------------------------------

    res.json(barberCardWithDetails);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Barber card not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   POST api/barber-card/request-delete
// @desc    Request deletion of barber card (sends to admin for approval)
// @access  Private
router.post('/request-delete', auth, validate(schemas.requestDeleteCard), async (req, res) => {
  const { reason, targetBarberId } = req.body;

  console.log('Request delete endpoint called');
  console.log('User ID:', req.user.id);
  console.log('Request body:', req.body);

  try {
    let barberCard;

    // Check if a specific barber is being targeted (Owner deleting staff)
    if (targetBarberId) {
      // 1. Verify the requester is a shop owner
      const shop = await Shop.findOne({ owner: req.user.id });
      if (!shop) {
        return res.status(403).json({ msg: 'Only shop owners can delete other staff members.' });
      }

      // 2. Verify the target barber is actually staff in this shop
      const isStaff = shop.staff.some(staffId => staffId.toString() === targetBarberId);
      if (!isStaff) {
        return res.status(404).json({ msg: 'Barber not found in your shop staff list.' });
      }

      // 3. Find the target barber's card
      barberCard = await BarberCard.findOne({ barberId: targetBarberId });
    } else {
      // Self-deletion request
      barberCard = await BarberCard.findOne({ barberId: req.user.id });
    }

    console.log('Found barber card:', barberCard);

    if (!barberCard) {
      return res.status(404).json({ msg: 'Barber card not found' });
    }

    // Check if there's already a pending delete request
    const existingRequest = await BarberCardDeleteRequest.findOne({
      barberCardId: barberCard._id,
      status: 'pending'
    });

    console.log('Existing request:', existingRequest);

    if (existingRequest) {
      return res.status(400).json({ msg: 'You already have a pending delete request for this barber card' });
    }

    // Get shop information
    let shopId = null;
    if (barberCard.shopId) {
      shopId = barberCard.shopId;
    } else {
      // Try to find shop by owner or staff
      let shop = await Shop.findOne({ owner: req.user.id });
      if (!shop) {
        shop = await Shop.findOne({ staff: req.user.id });
      }
      if (shop) {
        shopId = shop._id;
      }
    }

    console.log('Shop ID:', shopId);

    // Create delete request
    const deleteRequest = new BarberCardDeleteRequest({
      barberCardId: barberCard._id,
      barberId: req.user.id,
      shopId: shopId,
      reason: reason || '',
    });

    await deleteRequest.save();

    console.log('Delete request created:', deleteRequest._id);

    res.json({
      success: true,
      msg: 'Delete request sent to admin for approval',
      requestId: deleteRequest._id
    });
  } catch (err) {
    console.error('Error requesting barber card deletion:', err);
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
});

// @route   DELETE api/barber-card
// @desc    Delete user's barber card (admin approved deletion)
// @access  Private
router.delete('/', auth, async (req, res) => {
  try {
    const barberCard = await BarberCard.findOne({ barberId: req.user.id });

    if (!barberCard) {
      return res.status(404).json({ msg: 'Barber card not found' });
    }

    await BarberCard.findByIdAndDelete(barberCard._id);

    res.json({ success: true, msg: 'Barber card deleted successfully' });
  } catch (err) {
    console.error('Error deleting barber card:', err);
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
});

module.exports = router;
