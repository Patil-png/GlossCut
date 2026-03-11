require('dotenv').config();
const mongoose = require('mongoose');
const Booking = require('./models/Booking');

async function run() {
    try {
        await mongoose.connect(process.env.MONGO_URI, {});
        console.log("Connected to MongoDB.");

        const nowMs = Date.now();
        const utcMs = nowMs + new Date().getTimezoneOffset() * 60000;
        const istNow = new Date(utcMs + 3600000 * 5.5);
        const queryDate = new Date(istNow); queryDate.setHours(0, 0, 0, 0);
        const nextDay = new Date(queryDate); nextDay.setDate(nextDay.getDate() + 1);

        console.log("Querying from:", queryDate, "to", nextDay);

        const b = await Booking.find({
            date: { $gte: queryDate, $lt: nextDay }
        }).select('_id status userId barberId date paymentStatus');

        console.log("Bookings found for today (IST):", b.length);
        console.dir(b.map(x => x.toObject()), { depth: null });

        const bUtc = await Booking.find({
            date: { $gte: new Date(new Date().setHours(0, 0, 0, 0)), $lt: new Date(new Date().setHours(24, 0, 0, 0)) }
        }).select('_id status userId barberId date paymentStatus');

        console.log("Bookings found for today (UTC/Local):", bUtc.length);

        let all = await Booking.find().sort({ createdAt: -1 }).limit(3).select('date status createdAt paymentStatus');
        console.log("3 Most recent bookings created:");
        console.dir(all.map(x => x.toObject()), { depth: null });

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
run();
