const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Shop = require('../models/Shop');
const BarberCard = require('../models/BarberCard');
const auth = require('../middleware/auth');

// Ultra-efficient in-memory cache for liked barbers operations
const likedBarbersCache = new Map();
const LIKED_BARBERS_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes for liked barbers data

// Cache management functions
const getLikedBarbersCached = (key) => {
  const cached = likedBarbersCache.get(key);
  if (cached && Date.now() - cached.timestamp < LIKED_BARBERS_CACHE_DURATION) {
    return cached.data;
  }
  likedBarbersCache.delete(key);
  return null;
};

const setLikedBarbersCached = (key, data) => {
  likedBarbersCache.set(key, { data, timestamp: Date.now() });
  // Prevent memory leaks - limit cache size
  if (likedBarbersCache.size > 100) {
    const firstKey = likedBarbersCache.keys().next().value;
    likedBarbersCache.delete(firstKey);
  }
};

// @route   POST api/liked-barbers/add
// @desc    Add a barber/provider to liked list
// @access  Private
router.post('/add', auth, async (req, res) => {
  try {
    const { providerId, providerType } = req.body; // providerId can be barberId, shop owner _id, or staff _id

    if (!providerId || !providerType) {
      return res.status(400).json({ msg: 'Provider ID and type are required' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    // Check if already liked
    const existingLike = user.likedProviders.find(
      like => like.providerId.toString() === providerId && like.providerType === providerType
    );

    if (existingLike) {
      return res.status(400).json({ msg: 'Provider already liked' });
    }

    // Add to liked providers
    user.likedProviders.push({
      providerId,
      providerType,
      likedAt: new Date()
    });

    await user.save();

    res.json({
      msg: 'Provider added to favorites',
      likedProviders: user.likedProviders
    });
  } catch (err) {
    console.error('Error adding liked provider:', err.message);
    res.status(500).send('Server Error');
  }
});

// @route   DELETE api/liked-barbers/remove/:providerId/:providerType
// @desc    Remove a barber/provider from liked list
// @access  Private
router.delete('/remove/:providerId/:providerType', auth, async (req, res) => {
  try {
    const { providerId, providerType } = req.params;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    const initialCount = user.likedProviders.length;

    // Remove from liked providers
    user.likedProviders = user.likedProviders.filter(
      like => !(like.providerId.toString() === providerId && like.providerType === providerType)
    );

    const finalCount = user.likedProviders.length;
    const removed = initialCount - finalCount;

    await user.save();

    res.json({
      msg: removed > 0 ? 'Provider removed from favorites' : 'Provider was not in favorites',
      removed: removed,
      likedProviders: user.likedProviders
    });
  } catch (err) {
    console.error('Error removing liked provider:', err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/liked-barbers
// @desc    Get all liked providers with full details (ultra-optimized with caching)
router.get('/', auth, async (req, res) => {
  try {
    const cacheKey = `liked_barbers_${req.user.id}`;
    const cached = getLikedBarbersCached(cacheKey);

    if (cached) {
      return res.json(cached);
    }

    const user = await User.findById(req.user.id).select('likedProviders');
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    const likedProviders = [];

    // Batch fetch all barber cards and shops to reduce N+1 queries
    const barberCardIds = user.likedProviders
      .filter(like => like.providerType === 'barber')
      .map(like => like.providerId);

    const barberCards = await BarberCard.find({ _id: { $in: barberCardIds } })
      .lean();

    const shopProviderIds = user.likedProviders
      .filter(like => like.providerType === 'barber')
      .map(like => like.providerId);

    const shops = await Shop.find({
      $or: [
        { owner: { $in: shopProviderIds } },
        { staff: { $in: shopProviderIds } }
      ]
    }).lean();

    const userIds = [];
    shops.forEach(shop => {
      userIds.push(shop.owner);
      userIds.push(...shop.staff);
    });

    const users = await User.find({ _id: { $in: userIds } })
      .select('name profilePicture rating reviews isAvailable maxAppointmentsPerDay todaysBookings')
      .lean();

    const barberCardMap = new Map();
    barberCards.forEach(card => barberCardMap.set(card._id.toString(), card));

    const shopMap = new Map();
    shops.forEach(shop => shopMap.set(shop._id.toString(), shop));

    const userMap = new Map();
    users.forEach(user => userMap.set(user._id.toString(), user));

    // Process each liked provider with optimized lookups
    for (const like of user.likedProviders) {
      try {
        let providerData = null;

        if (like.providerType === 'barber') {
          // Try to find as barber card first
          const barberCard = barberCardMap.get(like.providerId.toString());
          if (barberCard) {
            providerData = {
              _id: barberCard._id,
              id: barberCard._id,
              barberId: barberCard.barberId,
              name: barberCard.name,
              address: barberCard.address,
              image: barberCard.image,
              rating: barberCard.rating || 0,
              reviews: barberCard.reviews || [],
              reviewCount: barberCard.reviewCount || 0,
              services: barberCard.services || [],
              category: barberCard.category || 'Barber',
              avgAppointmentTime: barberCard.avgAppointmentTime || '30 min',
              totalServices: barberCard.services?.length || 0,
              isAvailable: barberCard.isAvailable || false,
              todaysBookings: barberCard.todaysBookings || 0,
              shopName: barberCard.shopName || 'Independent',
              type: 'barber',
              likedAt: like.likedAt
            };
          } else {
            // Try to find as shop owner or staff
            const shop = shops.find(s =>
              s.owner.toString() === like.providerId.toString() ||
              s.staff.some(staffId => staffId.toString() === like.providerId.toString())
            );

            if (shop) {
              const isOwner = shop.owner.toString() === like.providerId.toString();
              const personId = like.providerId.toString();
              const personData = userMap.get(personId);

              if (personData) {
                providerData = {
                  _id: personData._id,
                  id: personData._id,
                  barberId: personData._id,
                  name: personData.name,
                  address: shop.address || 'Location Unavailable',
                  image: { uri: personData.profilePicture || "https://via.placeholder.com/150" },
                  rating: personData.rating || 0,
                  reviews: personData.reviews || [],
                  reviewCount: personData.reviews?.length || 0,
                  services: shop.services || [],
                  category: shop.category || 'Barber',
                  avgAppointmentTime: shop.avgAppointmentTime || '30 min',
                  totalServices: shop.services?.length || 0,
                  isAvailable: personData.isAvailable,
                  todaysBookings: personData.todaysBookings || 0,
                  shopName: shop.name,
                  type: 'barber',
                  likedAt: like.likedAt
                };
              }
            }
          }
        }

        if (providerData) {
          likedProviders.push(providerData);
        } else {
          // Create basic entry for missing data
          const basicProviderData = {
            _id: like._id,
            id: like.providerId,
            barberId: like.providerId,
            name: 'Unknown Provider',
            address: 'Location Unavailable',
            image: { uri: "https://via.placeholder.com/150" },
            rating: 0,
            reviews: [],
            reviewCount: 0,
            services: [],
            category: like.providerType === 'barber' ? 'Barber' : 'Unknown',
            avgAppointmentTime: '30 min',
            totalServices: 0,
            isAvailable: false,
            todaysBookings: 0,
            shopName: 'Unknown',
            type: 'barber',
            likedAt: like.likedAt
          };
          likedProviders.push(basicProviderData);
        }
      } catch (err) {
        console.error('Error processing liked provider:', like.providerId, err.message);
      }
    }

    // Sort by liked date (most recent first)
    likedProviders.sort((a, b) => new Date(b.likedAt) - new Date(a.likedAt));

    const result = {
      likedProviders,
      total: likedProviders.length
    };

    setLikedBarbersCached(cacheKey, result);
    res.json(result);
  } catch (err) {
    console.error('Error fetching liked providers:', err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/liked-barbers/check/:providerId/:providerType
// @desc    Check if a provider is liked by the user
// @access  Private
router.get('/check/:providerId/:providerType', auth, async (req, res) => {
  try {
    const { providerId, providerType } = req.params;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    const isLiked = user.likedProviders.some(
      like => like.providerId.toString() === providerId && like.providerType === providerType
    );

    res.json({ isLiked });
  } catch (err) {
    console.error('Error checking liked status:', err.message);
    res.status(500).send('Server Error');
  }
});

// @route   DELETE api/liked-barbers/clear
// @desc    Clear all liked providers (for cleanup)
// @access  Private
router.delete('/clear', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    user.likedProviders = [];
    await user.save();

    res.json({
      msg: 'All liked providers cleared',
      likedProviders: []
    });
  } catch (err) {
    console.error('Error clearing liked providers:', err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
