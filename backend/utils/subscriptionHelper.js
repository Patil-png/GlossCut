const User = require('../models/User');
const Shop = require('../models/Shop');
const cache = require('memory-cache');

/**
 * Checks if a user has an active subscription, either directly or via their shop owner.
 * @param {string} userId - The ID of the user to check.
 * @returns {Promise<{isActive: boolean, type: 'personal'|'shop'|'none', ownerId?: string}>}
 */
const checkEffectiveSubscription = async (userId) => {
    const cacheKey = `sub_status_${userId}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    try {
        // 1. Check direct subscription
        const user = await User.findById(userId).select('subscriptionStatus subscriptionExpiry');
        const now = new Date();

        if (user && user.subscriptionStatus === 'active' && user.subscriptionExpiry > now) {
            const res = { isActive: true, type: 'personal' };
            cache.put(cacheKey, res, 5 * 60 * 1000); // Cache for 5 mins
            return res;
        }

        // 2. Check if user is staff in a shop with an active owner
        const shops = await Shop.find({ staff: userId }).populate('owner', 'subscriptionStatus subscriptionExpiry');

        for (const shop of shops) {
            if (shop.owner &&
                shop.owner.subscriptionStatus === 'active' &&
                shop.owner.subscriptionExpiry > now) {
                const res = {
                    isActive: true,
                    type: 'shop',
                    ownerId: shop.owner._id
                };
                cache.put(cacheKey, res, 5 * 60 * 1000);
                return res;
            }
        }

        const res = { isActive: false, type: 'none' };
        cache.put(cacheKey, res, 5 * 60 * 1000);
        return res;
    } catch (error) {
        console.error('Error checking effective subscription:', error);
        return { isActive: false, type: 'none' };
    }
};

module.exports = { checkEffectiveSubscription };
