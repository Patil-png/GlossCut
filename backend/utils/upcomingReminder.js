const cron = require('node-cron');
const Booking = require('../models/Booking');
const User = require('../models/User');
const Shop = require('../models/Shop');
const { sendPushToUser } = require('./webPushService');

const startUpcomingBookingReminder = () => {
    // Run every 5 minutes
    cron.schedule('*/5 * * * *', async () => {
        try {
            const now = new Date();
            // Look 30-35 mins into the future
            const targetTimeStart = new Date(now.getTime() + 30 * 60000);
            const targetTimeEnd = new Date(now.getTime() + 35 * 60000);

            // Find bookings that are confirmed and starting in ~30 mins
            // Note: time is stored as string 'HH:mm' and date as string 'YYYY-MM-DD'
            // Need a bit of parsing since we're doing a string match on time

            // Because date and time are stored as strings, we need to format them
            const padZero = (num) => num.toString().padStart(2, '0');

            const targetDateStr = `${targetTimeStart.getFullYear()}-${padZero(targetTimeStart.getMonth() + 1)}-${padZero(targetTimeStart.getDate())}`;
            const targetHour = targetTimeStart.getHours();
            const targetMin = targetTimeStart.getMinutes();

            // Look for any 'confirmed' bookings for today
            const upcomingBookings = await Booking.find({
                date: targetDateStr,
                status: 'confirmed',
                // In real system we'd parse the time string, but for now we'll do an exact match 
                // string comparison or fetch all today's and filter in memory
            });

            for (const booking of upcomingBookings) {
                if (!booking.time || !booking.customerId) continue;

                // Parse "HH:mm A" or "14:30", assume 24h format for simplicity
                const [timeParts, modifier] = booking.time.split(' ');
                let [hours, minutes] = timeParts.split(':').map(Number);

                if (modifier && modifier.toUpperCase() === 'PM' && hours < 12) hours += 12;
                if (modifier && modifier.toUpperCase() === 'AM' && hours === 12) hours = 0;

                const bookingDateTime = new Date(
                    targetTimeStart.getFullYear(),
                    targetTimeStart.getMonth(),
                    targetTimeStart.getDate(),
                    hours, minutes, 0
                );

                // If booking is exactly between 30 and 35 minutes from now
                if (bookingDateTime > targetTimeStart && bookingDateTime <= targetTimeEnd) {
                    try {
                        const customer = await User.findById(booking.customerId);
                        if (customer && customer.webPushSubscription) {
                            const barber = await User.findById(booking.barberId);
                            await sendPushToUser(customer, {
                                title: '⏰ Your cut is in 30 minutes!',
                                body: `${barber ? barber.name : 'Your appointment'} is at ${booking.time}. Tap to track live queue.`,
                                url: `/track-booking/${booking._id.toString()}`,
                                tag: 'booking-reminder'
                            });
                        }
                    } catch (e) {
                        console.error('Error sending reminder web push', e);
                    }
                }
            }
        } catch (err) {
            console.error('CRON Error (Upcoming Booking):', err);
        }
    });

    console.log('✅ Upcoming Appointment Reminder scheduler started');
};

module.exports = startUpcomingBookingReminder;
