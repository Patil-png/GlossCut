const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { sendPushToUser } = require('./utils/webPushService');
const User = require('./models/User');

async function test() {
    try {
        console.log("Connecting to MongoDB...");
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ Connected.");

        // Find a barber who has enabled notifications
        const barber = await User.findOne({ 
            role: 'barber', 
            webPushSubscription: { $exists: true, $ne: null } 
        });

        if (!barber) {
            console.log("⚠️ No barber found with an active Web Push subscription for testing.");
            process.exit(1);
        } else {
            testWithUser(barber);
        }
    } catch (err) {
        console.error("❌ Test Failed:", err.message);
        process.exit(1);
    }
}

async function testWithUser(user) {
    console.log(`🚀 Triggering Demo Notification for: ${user.name || 'User'} (${user._id})`);
    
    const testPayload = {
      title: '💳 DEMO: Left-Side Fix Success',
      body: 'Check the small icon on the left (next to GlossCut)',
      icon: '/GlossCutQr.png',
      badge: '/ic_stat_notification_icon.png',
      url: '/queue',
      tag: 'booking_new'
    };

    console.log("📦 Standardized Payload Structure:", JSON.stringify(testPayload, null, 2));
    
    try {
        await sendPushToUser(user, testPayload);
        console.log("\n✅ DEMO SUCCESSFUL");
    } catch (err) {
        console.error("❌ Send Failed:", err.message);
    } finally {
        mongoose.connection.close();
        process.exit(0);
    }
}

test();
