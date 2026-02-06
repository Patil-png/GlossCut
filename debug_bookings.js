const mongoose = require('mongoose');
const Booking = require('./models/Booking');
require('dotenv').config();

async function debug() {
    try {
        const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/setkarr'; // Adjust if needed
        await mongoose.connect(mongoURI);
        console.log('Connected to MongoDB');

        const now = new Date();
        const startOfDay = new Date(now.setHours(0, 0, 0, 0));
        const endOfDay = new Date(now.setHours(23, 59, 59, 999));

        console.log(`Checking bookings for range: ${startOfDay.toISOString()} to ${endOfDay.toISOString()}`);

        const bookings = await Booking.find({
            date: { $gte: startOfDay, $lte: endOfDay }
        });

        console.log(`Found ${bookings.length} bookings for today.`);
        bookings.forEach(b => {
            console.log(`ID: ${b._id}, Barber: ${b.barberId}, Status: ${b.status}, Paid: ${b.paymentStatus}, Offline: ${b.isOfflineBooking}, Total: ${b.totalPrice}, Created: ${b.createdAt}`);
        });

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

debug();
