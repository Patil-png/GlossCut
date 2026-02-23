const cron = require('node-cron');
const Attendance = require('../models/Attendance');

/**
 * Attendance Cleaner Utility
 * Purges old attendance data at the start of each month to keep the database lean.
 * Runs on the 1st of every month at 00:05 IST.
 */
const startAttendanceCleaner = () => {
    // Schedule: 05 00 1 * * (1st day of month, 00:05)
    // Note: node-cron runs in server local time, so we check IST inside the job if needed,
    // but typically we can just run it once a month.
    cron.schedule('5 0 1 * *', async () => {
        console.log('--- Attendance Multi-Month Cleanup Starting ---');

        try {
            // Get current IST date
            const istNow = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));

            // Boundary: First day of the CURRENT month (YYYY-MM-01)
            const currentYear = istNow.getFullYear();
            const currentMonth = (istNow.getMonth() + 1).toString().padStart(2, '0');
            const boundaryDate = `${currentYear}-${currentMonth}-01`;

            console.log(`Cleaning up attendance records older than ${boundaryDate}...`);

            // Delete records where date string is less than the first day of the current month
            const result = await Attendance.deleteMany({
                date: { $lt: boundaryDate }
            });

            console.log(`✅ Cleanup Complete: Deleted ${result.deletedCount} old attendance records.`);
        } catch (error) {
            console.error('❌ Error during attendance cleanup:', error);
        }
    });
};

module.exports = startAttendanceCleaner;
