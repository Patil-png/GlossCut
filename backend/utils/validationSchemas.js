const Joi = require('joi');

/**
 * Validation Schemas
 * Defines strict rules for input data.
 */

const schemas = {
    // --- AUTH SCHEMAS ---
    register: Joi.object({
        name: Joi.string().min(2).max(50).required(),
        email: Joi.string().email().lowercase().required(),
        password: Joi.string().min(8).required(),
        role: Joi.string().valid('customer', 'barber').default('customer'),
        phone: Joi.string().pattern(/^[0-9]+$/).min(10).max(15).optional(),
        shopName: Joi.string().optional(),
        shopAddress: Joi.string().optional(),
        shopPhone: Joi.string().optional(),
        category: Joi.string().optional(),
        selectedShopId: Joi.string().optional().allow(null),
        isShopOwner: Joi.boolean().optional()
    }),

    login: Joi.object({
        email: Joi.string().email().lowercase().required(),
        password: Joi.string().required()
    }),

    // --- SHOP SCHEMAS ---
    createShop: Joi.object({
        name: Joi.string().min(2).required(),
        address: Joi.string().min(5).required(),
        phone: Joi.string().min(10).required(),
        category: Joi.string().valid('Barber', "Women's Salon", 'Pet Care').required()
    }),

    updateShop: Joi.object({
        name: Joi.string().min(2).optional(),
        address: Joi.string().min(5).optional(),
        phone: Joi.string().min(10).optional(),
        services: Joi.array().items(Joi.object({
            name: Joi.string().required(),
            price: Joi.number().required(),
            duration: Joi.number().optional().allow(null),
            description: Joi.string().optional().allow('')
        })).optional(),
        tag: Joi.string().optional().allow(''),
        location: Joi.alternatives().try(Joi.string(), Joi.object()).optional(),
        avgAppointmentTime: Joi.number().optional(),
        isAvailable: Joi.boolean().optional(),
        image: Joi.string().uri().optional().allow(''),
        upiId: Joi.string().optional().allow(''),
        operatingHours: Joi.object().optional()
    }),

    updateShopCategory: Joi.object({
        category: Joi.string().valid('Barber', "Women's Salon", 'Pet Care').required()
    }),

    updateListingTier: Joi.object({
        tierId: Joi.number().required(),
        category: Joi.string().required()
    }),

    updateShopTag: Joi.object({
        tag: Joi.string().required()
    }),

    listingPlace: Joi.object({
        tier: Joi.number().required(),
        price: Joi.number().required(),
        duration: Joi.number().required()
    }),

    // --- BOOKING SCHEMAS ---
    createBooking: Joi.object({
        barberId: Joi.string().required(),
        date: Joi.date().required(),
        time: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required(), // HH:MM
        services: Joi.array().min(1).required(),
        totalPrice: Joi.alternatives().try(Joi.number(), Joi.string()).required(),
        appointmentType: Joi.string().valid('Basic', 'Express', 'Premium', 'Black Premium').default('Basic'),
        isOfflineBooking: Joi.boolean().default(false),
        customerName: Joi.string().optional().allow(''),
        customerPhone: Joi.string().optional().allow(''),
        customerInfo: Joi.object().optional()
    }),

    createPublicBooking: Joi.object({
        barberId: Joi.string().required(),
        date: Joi.date().required(),
        time: Joi.string().required(),
        services: Joi.array().required(),
        totalPrice: Joi.alternatives().try(Joi.number(), Joi.string()).required(),
        appointmentType: Joi.string().default('Basic'),
        customerInfo: Joi.object({
            name: Joi.string().required(),
            phone: Joi.string().required()
        }).required()
    }),

    declineBooking: Joi.object({
        cancellationReason: Joi.string().required()
    }),

    verifyBookingOtp: Joi.object({
        bookingId: Joi.string().required(),
        otp: Joi.string().length(6).required()
    }),

    // --- USER SCHEMAS ---
    rechargeCoins: Joi.object({
        coins: Joi.number().min(1).required()
    }),

    // --- BARBER CARD SCHEMAS ---
    createBarberCard: Joi.object({
        name: Joi.string().optional(),
        services: Joi.array().optional(),
        specialties: Joi.array().optional(),
        avgAppointmentTime: Joi.string().optional(),
        isAvailable: Joi.boolean().optional()
    }),

    updateBarberCard: Joi.object({
        name: Joi.string().optional(),
        services: Joi.array().optional(),
        specialties: Joi.array().optional(),
        avgAppointmentTime: Joi.string().optional(),
        isAvailable: Joi.boolean().optional(),
        image: Joi.string().optional().allow(''),
        maxAppointments: Joi.number().optional(),
        maxAppointmentsPerDay: Joi.number().optional()
    }),

    requestDeleteCard: Joi.object({
        reason: Joi.string().optional().allow(''),
        targetBarberId: Joi.string().optional()
    }),

    // --- PAYMENT SCHEMAS ---
    createOrder: Joi.object({
        amount: Joi.number().required(),
        currency: Joi.string().default('INR'),
        receipt: Joi.string().required()
    }),

    verifyPayment: Joi.object({
        order_id: Joi.string().required(),
        payment_id: Joi.string().required(),
        signature: Joi.string().required(),
        bookingId: Joi.string().required()
    }),

    dummyPayment: Joi.object({
        bookingId: Joi.string().required(),
        coinsUsed: Joi.number().optional()
    }),

    bookWithoutPayment: Joi.object({
        barberId: Joi.string().required(),
        services: Joi.array().required(),
        date: Joi.string().required(),
        time: Joi.string().required(),
        totalPrice: Joi.number().required(),
        otp: Joi.string().optional()
    }),

    listingOrder: Joi.object({
        tierId: Joi.number().required(),
        price: Joi.number().required(),
        category: Joi.string().required()
    }),

    verifyListing: Joi.object({
        razorpay_order_id: Joi.string().required(),
        razorpay_payment_id: Joi.string().required(),
        razorpay_signature: Joi.string().required(),
        tierId: Joi.number().required(),
        price: Joi.number().required(),
        category: Joi.string().required()
    }),

    adOrder: Joi.object({
        price: Joi.number().required(),
        adId: Joi.string().required()
    }),

    verifyAd: Joi.object({
        razorpay_order_id: Joi.string().required(),
        razorpay_payment_id: Joi.string().required(),
        razorpay_signature: Joi.string().required(),
        adId: Joi.string().required()
    }),

    sendOtp: Joi.object({
        email: Joi.string().email().required(),
        otp: Joi.string().required()
    }),

    // --- REVIEW SCHEMAS ---
    createReview: Joi.object({
        barberId: Joi.string().optional(),
        bookingId: Joi.string().required(),
        rating: Joi.number().min(1).max(5).required(),
        comment: Joi.string().optional().allow(''),
        title: Joi.string().optional().allow('')
    }).unknown(true),

    respondReview: Joi.object({
        barberResponse: Joi.string().required()
    }),

    // --- NOTIFICATION SCHEMAS ---
    markRead: Joi.object({
        read: Joi.boolean().optional()
    }),

    // --- CHAT SCHEMAS ---
    sendChat: Joi.object({
        receiverId: Joi.string().required(),
        message: Joi.string().required(),
        appType: Joi.string().optional()
    }),

    // --- PASSWORD SCHEMAS ---
    forgotPassword: Joi.object({
        email: Joi.string().email().required()
    }),

    verifyOtp: Joi.object({
        email: Joi.string().email().required(),
        otp: Joi.string().length(6).required()
            .pattern(/^[0-9]+$/)
    }),

    resetPassword: Joi.object({
        email: Joi.string().email().required(),
        otp: Joi.string().required(),
        password: Joi.string().min(8).required()
    }),

    // --- ADMIN AUTH SCHEMAS ---
    adminLogin: Joi.object({
        email: Joi.string().email().required(),
        password: Joi.string().required()
    }),

    adminRegister: Joi.object({
        name: Joi.string().required(),
        email: Joi.string().email().required(),
        password: Joi.string().min(8).required(),
        role: Joi.string().valid('admin', 'superadmin').default('admin'),
        permissions: Joi.array().items(Joi.string()).optional()
    }),

    // --- EXCLUSIVE DEALS SCHEMAS ---
    createDeal: Joi.object({
        title: Joi.string().required(),
        description: Joi.string().optional().allow(''),
        image: Joi.string().uri().optional().allow(''),
        discountPercentage: Joi.number().min(0).max(100).optional(),
        bonusCoins: Joi.number().min(0).optional(),
        minimumPurchase: Joi.number().min(0).optional(),
        validUntil: Joi.date().optional()
    }),

    updateDeal: Joi.object({
        title: Joi.string().optional(),
        description: Joi.string().optional().allow(''),
        image: Joi.string().uri().optional().allow(''),
        discountPercentage: Joi.number().min(0).max(100).optional(),
        bonusCoins: Joi.number().min(0).optional(),
        minimumPurchase: Joi.number().min(0).optional(),
        validUntil: Joi.date().optional(),
        isActive: Joi.boolean().optional()
    }),

    // --- LIKED BARBERS SCHEMAS ---
    addLikedProvider: Joi.object({
        providerId: Joi.string().required(),
        providerType: Joi.string().valid('barber', 'shop').required()
    })
};

module.exports = schemas;
