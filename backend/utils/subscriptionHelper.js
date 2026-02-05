const User = require('../models/User');
const Shop = require('../models/Shop');

/**
 * Checks if a user has an active subscription, either directly or via their shop owner.
 * @param {string} userId - The ID of the user to check.
 * @returns {Promise<{isActive: boolean, type: 'personal'|'shop'|'none', ownerId?: string}>}
 */
const checkEffectiveSubscription = async (userId) => {
    try {
        // 1. Check direct subscription
        const user = await User.findById(userId).select('subscriptionStatus subscriptionExpiry');
        if (user && user.subscriptionStatus === 'active') {
            return { isActive: true, type: 'personal' };
        }

        // 2. Check if user is staff in a shop with an active owner
        // Find shops where this user is in the staff list
        const shops = await Shop.find({ staff: userId }).populate('owner', 'subscriptionStatus');

        for (const shop of shops) {
            if (shop.owner && shop.owner.subscriptionStatus === 'active') {
                return {
                    isActive: true,
                    type: 'shop',
                    ownerId: shop.owner._id
                };
            }
        }

        return { isActive: false, type: 'none' };
    } catch (error) {
        console.error('Error checking effective subscription:', error);
        return { isActive: false, type: 'none' };
    }
};

module.exports = { checkEffectiveSubscription };
