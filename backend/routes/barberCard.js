const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const BarberCard = require('../models/BarberCard');
const BarberCardDeleteRequest = require('../models/BarberCardDeleteRequest');
const Shop = require('../models/Shop');
const User = require('../models/User');
const Review = require('../models/Review');
const Service = require('../models/Service');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const { uploadToR2, extractKeyFromUrl, uploadToR2WithCleanup } = require('../utils/r2Storage');
const validate = require('../middleware/validate');
const schemas = require('../utils/validationSchemas');

// Simple in-memory cache for barber card data (use Redis in production)
const barberCardCache = new Map();
const BARBER_CARD_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

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
  const { name, services, specialties, avgAppointmentTime, isAvailable } = req.body;

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

    const barberCard = new BarberCard({
      barberId: req.user.id,
      shopId: shop ? shop._id : null,
      name,
      services: services || [],
      specialties: specialties || [],
      avgAppointmentTime: calculatedAvgTime,
      isAvailable: isAvailable !== undefined ? isAvailable : true,
      approvalStatus: 'pending', // New cards start as pending approval
    });

    await barberCard.save();
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
    const barberCard = await BarberCard.findOne({ barberId: req.user.id });
    if (!barberCard) {
      return res.status(404).json({ msg: 'Barber card not found' });
    }
    // Prevent caching to ensuring "pending" updates are seen immediately
    res.set('Cache-Control', 'no-store');
    res.json(barberCard);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/barber-card
// @desc    Update user's barber card
// @access  Private
router.put('/', auth, validate(schemas.updateBarberCard), async (req, res) => {
  const { name, services, specialties, avgAppointmentTime, isAvailable, image } = req.body;

  try {
    let barberCard = await BarberCard.findOne({ barberId: req.user.id });

    if (!barberCard) {
      return res.status(404).json({ msg: 'Barber card not found' });
    }

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

    if (services !== undefined) {
      // DIRECT UPDATE: Services no longer require admin approval and won't be sent to admin
      barberCard.services = services;
      // Mark as modified since it's an array
      barberCard.markModified('services');
      console.log(`⚡ Services updated directly for barber card ${barberCard._id}`);
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
    console.error('❌ Error updating barber card:', err);
    console.error(err.stack);
    res.status(500).json({ msg: 'Server Error', error: err.message, details: err.stack });
  }
});

// @route   GET api/barber-card/all
// @desc    Get all barber cards (HEAVILY OPTIMIZED - NO CACHING for real-time availability)
// @access  Public
router.get('/all', async (req, res) => {
  try {
    const { category, shopId, page, limit } = req.query;
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
      .populate('barberId', 'profilePicture rating reviews maxAppointmentsPerDay todaysBookings isAvailable')
      .populate('shopId', 'name address category tag isAvailable')
      .sort({ createdAt: -1 });

    if (limitNum > 0) {
      query = query.skip(skip).limit(limitNum);
    }

    const barberCardsRaw = await query;
    // Filter out cards where the associated barber user has been deleted
    const barberCards = barberCardsRaw.filter(card => card.barberId);

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

    // 4. Construct Final Data
    const barberCardsWithBookings = barberCards.map((card) => {
      const reviewData = reviewsMap.get(card.barberId._id.toString());

      const reviews = reviewData ? reviewData.reviews : [];
      const reviewCount = reviewData ? reviewData.count : 0;
      const averageRating = reviewData ? reviewData.avgRating : (card.rating || card.barberId.rating || 0);

      return {
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
        services: card.services || [],
        category: card.shopId ? card.shopId.category : 'General',
        tag: card.specialties?.[0] || (card.shopId ? card.shopId.tag : 'Barber'),
        avgAppointmentTime: card.avgAppointmentTime,
        totalServices: card.services?.length || 0,
        isAvailable: card.barberId.isAvailable,
        todaysBookings: card.barberId.todaysBookings || 0,
        shopName: card.shopId ? card.shopId.name : 'Independent',
        listingTier: 'Basic',
        reviews,
        approvalStatus: card.approvalStatus, // Include approval status for UI indicators
      };
    });

    // Prevent caching of approval-sensitive data
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
    res.json(barberCardsWithBookings);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
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
      .populate('shopId', 'name address category tag isAvailable');

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
      services: barberCard.services || [],
      category: barberCard.shopId ? barberCard.shopId.category : 'General',
      tag: barberCard.specialties?.[0] || (barberCard.shopId ? barberCard.shopId.tag : 'Barber'),
      avgAppointmentTime: barberCard.avgAppointmentTime,
      totalServices: barberCard.services?.length || 0,
      isAvailable: barberCard.barberId.isAvailable,
      todaysBookings: barberCard.barberId.todaysBookings || 0,
      shopName: barberCard.shopId ? barberCard.shopId.name : 'Independent',
      listingTier: 'Basic',
      reviews: reviewData.reviews,
      approvalStatus: barberCard.approvalStatus,
    };

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
