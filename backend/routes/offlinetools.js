const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Shop = require('../models/Shop');
const Booking = require('../models/Booking');
const User = require('../models/User');

// --- Helper: Calculate Distance (Haversine Formula) ---
function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in km
    return d;
}

function deg2rad(deg) {
    return deg * (Math.PI / 180);
}

// --- 1. GET SHOP DETAILS (Name + Services) ---
router.get('/shop-details/:shopId', async (req, res) => {
    try {
        const { shopId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(shopId)) {
            return res.status(400).json({ msg: 'Invalid Shop ID' });
        }

        const shop = await Shop.findById(shopId).select('name services location');
        if (!shop) {
            return res.status(404).json({ msg: 'Shop not found' });
        }

        // Return only necessary details
        res.json({
            name: shop.name?.content || shop.name, // Handle encryption if applicable
            services: shop.services || [],
            // Don't send exact location to client to prevent spoofing easily,
            // but client needs to know if shop exists.
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
        const { shopId, name, phone, serviceIds } = req.body;

        if (!shopId || !name || !phone || !serviceIds || !Array.isArray(serviceIds) || serviceIds.length === 0) {
            return res.status(400).json({ msg: 'Missing required fields' });
        }

        const shop = await Shop.findById(shopId);
        if (!shop) return res.status(404).json({ msg: 'Shop not found' });

        // Validate Services & Calculate Total
        let selectedServices = [];
        let totalPrice = 0;
        let totalTime = 0;

        serviceIds.forEach(id => {
            const service = shop.services.find(s => s.id === id || s._id.toString() === id);
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

        // Create Booking
        const newBooking = new Booking({
            barberId: shop.owner, // Assign to Shop Owner (Barber)
            userId: null, // Offline user has no registered ID
            isOfflineBooking: true,
            customerName: name, // Will be encrypted by model
            customerPhone: phone, // Will be encrypted by model
            services: selectedServices,
            totalPrice: totalPrice,
            date: new Date(),
            time: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }), // Current Time
            status: 'pending', // Barber must accept
            paymentStatus: 'pending',
            appointmentType: 'Walk-in',
            tempDelayMinutes: 0
        });

        await newBooking.save();

        // Emit Socket Event to Barber
        const io = req.app.get('io');
        if (io) {
            io.to(`barber_${shop.owner.toString()}`).emit('new_booking', {
                type: 'offline_request',
                booking: newBooking
            });
        }

        res.json({ success: true, bookingId: newBooking._id });

    } catch (err) {
        console.error('Error requesting to join:', err);
        res.status(500).json({ msg: 'Server Error' });
    }
});

module.exports = router;
