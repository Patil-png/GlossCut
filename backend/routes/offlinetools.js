const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Shop = require('../models/Shop');
const Booking = require('../models/Booking');
const User = require('../models/User');
const BarberCard = require('../models/BarberCard');
const ServiceCategory = require('../models/ServiceCategory');
const Service = require('../models/Service');
const { decrypt } = require('../utils/EncryptionService');
const { generateUniqueTrackingId } = require('./track');

const { getDistanceFromLatLonInKm } = require('../utils/geoUtils');

// --- Helper: Get IST Date ---
function getISTDate() {
    const now = new Date();
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    return new Date(utc + (3600000 * 5.5));
}


// --- 1. GET SHOP DETAILS (Name + Services + Professionals) ---
router.get('/shop-details/:shopId', async (req, res) => {
    try {
        const { shopId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(shopId)) {
            return res.status(400).json({ msg: 'Invalid Shop ID' });
        }

        const shop = await Shop.findById(shopId)
            .select('name services location owner staff forceStaffServiceSync')
            .populate('owner', 'name profilePicture isAvailable')
            .populate('staff', 'name profilePicture isAvailable');

        if (!shop) {
            return res.status(404).json({ msg: 'Shop not found' });
        }

        const professionals = [];

        // Helper to get name string safely
        const getName = (user) => {
            if (!user.name) return 'Unknown';
            // If mongoose getter didn't run and we have raw object
            if (user.name.content && user.name.iv) {
                return decrypt(user.name);
            }
            return user.name;
        };

        // 1. Add Owner (Primary) - Strictly check availability
        if (shop.owner && shop.owner.isAvailable !== false) {
            professionals.push({
                id: shop.owner._id,
                name: getName(shop.owner),
                image: shop.owner.profilePicture,
                role: 'Owner'
            });
        }

        // 2. Add Staff - Strictly check availability
        if (shop.staff && shop.staff.length > 0) {
            shop.staff.forEach(staffMember => {
                if (staffMember.isAvailable === true) { // Force explicit check
                    professionals.push({
                        id: staffMember._id,
                        name: getName(staffMember),
                        image: staffMember.profilePicture, // Prioritize User profile pic for consistency
                        role: 'Staff'
                    });
                }
            });
        }

        // --- NEW: Aggregate Services from BarberCards ---
        // Since services are stored in BarberCards, not always in Shop.services
        const professionalIds = professionals.map(p => p.id);
        const [barberCards, masterServices] = await Promise.all([
            BarberCard.find({ barberId: { $in: professionalIds }, approvalStatus: 'approved' }),
            Service.find({ shopId: shopId, isActive: true })
        ]);

        let allServices = [];

        // 1. Prepare Shop Services (Base for sync)
        const shopServicesAggregated = (shop.services || []).map(s => {
            const sObj = s.toObject ? s.toObject() : s;
            const sId = sObj.serviceId || sObj.id; // Normalize ID
            const master = masterServices.find(ms => ms._id.toString() === sId?.toString());
            return {
                ...sObj,
                serviceId: sId,
                id: sId?.toString(),
                category: sObj.category || master?.category || 'General',
                gender: sObj.gender || master?.gender || 'unisex',
                barberId: "", // Generic Shop Service
                source: 'Shop'
            };
        });

        // 2. Process each professional
        professionals.forEach(p => {
            const card = barberCards.find(c => c.barberId.toString() === p.id.toString());
            const barberServices = card?.services || [];

            if (shop.forceStaffServiceSync) {
                // SYNC MODE: Start with Shop services, append barber-specific overrides if not in shop list
                const syncList = shopServicesAggregated.map(ss => ({
                    ...ss,
                    barberId: p.id.toString(),
                    barberName: p.name,
                    source: 'Synced'
                }));

                // Add barber specific ones that are NOT in the shop master list (by serviceId)
                const shopServiceIds = new Set(shopServicesAggregated.map(ss => ss.serviceId?.toString()));
                barberServices.forEach(bs => {
                    const bsObj = bs.toObject ? bs.toObject() : bs;
                    if (!shopServiceIds.has(bsObj.serviceId?.toString())) {
                        const master = masterServices.find(ms => ms._id.toString() === bsObj.serviceId?.toString());
                        syncList.push({
                            ...bsObj,
                            category: bsObj.category || master?.category || 'General',
                            gender: bsObj.gender || master?.gender || 'unisex',
                            barberId: p.id.toString(),
                            barberName: p.name,
                            source: 'BarberSpecific'
                        });
                    }
                });
                allServices.push(...syncList);
            } else {
                // CLASSIC MODE: Use BarberCard services as they are
                barberServices.forEach(bs => {
                    const bsObj = bs.toObject ? bs.toObject() : bs;
                    const master = masterServices.find(ms => ms._id.toString() === bsObj.serviceId?.toString());
                    allServices.push({
                        ...bsObj,
                        category: bsObj.category || master?.category || 'General',
                        gender: bsObj.gender || master?.gender || 'unisex',
                        barberId: p.id.toString(),
                        barberName: p.name,
                        source: 'BarberCard'
                    });
                });
            }
        });

        // console.log(`Aggregated ${allServices.length} services for shop ${shopId}. Sync: ${shop.forceStaffServiceSync}`);

        // --- NEW: Category Metadata ---
        const categoryMeta = await ServiceCategory.find({
            $or: [{ shopId: null }, { shopId: shopId }]
        }).select('name emoji color gender');

        // --- NEW: Category Order from Owner's Card ---
        const ownerId = shop.owner?._id || shop.owner;
        const ownerCard = ownerId ? barberCards.find(c => c.barberId.toString() === ownerId.toString()) : null;
        const categoryOrder = ownerCard?.categoryOrder || [];

        res.json({
            name: shop.name?.content || shop.name, // Handle encryption if applicable
            services: allServices,
            professionals: professionals,
            forceStaffServiceSync: shop.forceStaffServiceSync,
            categoryOrder: categoryOrder,
            categoryMeta: categoryMeta
        });
    } catch (err) {
        console.error('Error fetching shop details:', err);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// --- 2. VERIFY LOCATION (Geofence Check) ---
router.post('/verify-location', async (req, res) => {
    try {
        const { shopId, latitude, longitude } = req.body;

        if (!shopId || !latitude || !longitude) {
            return res.status(400).json({ msg: 'Missing parameters' });
        }

        const shop = await Shop.findById(shopId).select('location');
        if (!shop || !shop.location || !shop.location.coordinates) {
            return res.status(404).json({ msg: 'Shop location not found' });
        }

        const [shopLon, shopLat] = shop.location.coordinates;
        const distanceKm = getDistanceFromLatLonInKm(latitude, longitude, shopLat, shopLon);
        const distanceMeters = distanceKm * 1000;

        // THRESHOLD: 40 meters
        const MAX_DISTANCE_METERS = 40;

        if (distanceMeters <= MAX_DISTANCE_METERS) {
            res.json({ allowed: true, distance: distanceMeters });
        } else {
            res.json({
                allowed: false,
                distance: distanceMeters,
                msg: `You are ${Math.round(distanceMeters)}m away. Please move closer to the shop.`
            });
        }

    } catch (err) {
        console.error('Error verifying location:', err);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// --- 3. REQUEST JOIN (Create Pending Booking) ---
router.post('/request-join', async (req, res) => {
    try {
        const { shopId, name, phone, serviceIds, selectedBarberId } = req.body;

        if (!shopId || !name || !phone || !serviceIds || !Array.isArray(serviceIds) || serviceIds.length === 0) {
            return res.status(400).json({ msg: 'Missing required fields' });
        }

        const shop = await Shop.findById(shopId);
        if (!shop) return res.status(404).json({ msg: 'Shop not found' });

        // --- NEW: Fetch Barber Cards for Validation ---
        const staffIds = [shop.owner, ...(shop.staff || [])];
        const allCards = await BarberCard.find({ barberId: { $in: staffIds } });
        const allUsers = await User.find({ _id: { $in: staffIds } });

        // Validate Services & Calculate Total
        let selectedServices = [];
        let totalPrice = 0;
        let totalTime = 0;

        serviceIds.forEach(id => {
            // 1. Try finding in Shop Services
            let service = shop.services?.find(s => s.id === id || s._id.toString() === id);

            // 2. If not found, look in BarberCards
            if (!service && allCards.length > 0) {
                for (const card of allCards) {
                    const found = card.services.find(s => s.id === id || s._id?.toString() === id);
                    if (found) {
                        service = found;
                        break;
                    }
                }
            }

            if (service) {
                selectedServices.push({
                    id: service.id || service._id,
                    name: service.name,
                    price: parseFloat(service.price)
                });
                totalPrice += parseFloat(service.price);
                // Parse time (e.g., "30 min")
                const timeMatch = service.time?.match(/(\d+)/);
                if (timeMatch) totalTime += parseInt(timeMatch[0]);
            }
        });

        if (selectedServices.length === 0) {
            return res.status(400).json({ msg: 'No valid services selected' });
        }

        // Determine Target Barber
        // If selectedBarberId is provided and valid (part of shop staff/owner), use it.
        // Otherwise default to Shop Owner.
        let targetBarberId = shop.owner;
        if (selectedBarberId && mongoose.Types.ObjectId.isValid(selectedBarberId)) {
            // Verify if this barber belongs to the shop (Owner or Staff)
            const isOwner = shop.owner.toString() === selectedBarberId;
            const isStaff = shop.staff.some(s => s.toString() === selectedBarberId);

            if (isOwner || isStaff) {
                targetBarberId = selectedBarberId;
            }
        }

        // --- NEW: Check if target barber is available ---
        const targetUser = allUsers.find(u => u._id.toString() === targetBarberId.toString());
        if (targetUser && targetUser.isAvailable === false) {
            return res.status(400).json({ msg: 'Selected professional is currently offline and not accepting walk-ins.' });
        }

        // Generate Unique Tracking ID
        const trackingId = await generateUniqueTrackingId();

        // Generate IST Date & Time
        const istDate = getISTDate();
        const formattedTime = istDate.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });

        // Create Booking
        const newBooking = new Booking({
            barberId: targetBarberId, // Specific Barber Queue
            userId: null, // Offline user has no registered ID
            isOfflineBooking: true,
            customerName: name, // Will be encrypted by model
            customerPhone: phone, // Will be encrypted by model
            services: selectedServices,
            totalPrice: totalPrice,
            date: istDate,
            time: formattedTime, // IST Time
            status: 'pending', // Barber must accept
            paymentStatus: 'pending',
            appointmentType: 'Walk-in',
            tempDelayMinutes: 0,
            queueTrackingId: trackingId
        });

        await newBooking.save();

        // Emit Socket Event to Barber
        const io = req.app.get('io');
        if (io) {
            io.to(`barber_${targetBarberId.toString()}`).emit('new_booking', {
                bookingId: newBooking._id,
                customerName: name, // Decrypted name passed in request
                appointmentType: newBooking.appointmentType,
                time: newBooking.time,
                services: newBooking.services,
                status: 'pending' // Offline requests always start as pending
            });
        }

        res.json({
            success: true,
            bookingId: newBooking._id,
            trackingId: trackingId
        });

    } catch (err) {
        console.error('Error requesting to join:', err);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// --- 4. CHECK BOOKING STATUS (Polling) ---
router.get('/booking-status/:bookingId', async (req, res) => {
    try {
        const { bookingId } = req.params;
        if (!mongoose.Types.ObjectId.isValid(bookingId)) {
            return res.status(400).json({ msg: 'Invalid Booking ID' });
        }

        const booking = await Booking.findById(bookingId).select('status');
        if (!booking) {
            return res.status(404).json({ msg: 'Booking not found' });
        }

        res.json({ status: booking.status });

    } catch (err) {
        console.error('Error fetching booking status:', err);
        res.status(500).json({ msg: 'Server Error' });
    }
});

module.exports = router;
