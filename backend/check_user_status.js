const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const User = require('./models/User');
const { createHMAC } = require('./utils/EncryptionService');

async function checkUser() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const email = 'therazorsedge@gmail.com';
        const emailHash = createHMAC(email.toLowerCase());

        console.log(`Checking email: ${email}`);
        console.log(`Calculated Hash: ${emailHash}`);

        const user = await User.findOne({ emailHash });

        if (user) {
            console.log('✅ User Found!');
            console.log(`ID: ${user._id}`);
            console.log(`Role: ${user.role}`);
            console.log(`Email: ${user.email}`); // Should decrypt via getter
            console.log(`Phone: ${user.phone}`); // Should decrypt via getter
            console.log(`Has Password: ${!!user.password}`);
            console.log(`Has GoogleID: ${!!user.googleId}`);
            console.log(`Email Hash in DB: ${user.emailHash}`);
            console.log(`Match: ${user.emailHash === emailHash ? 'YES' : 'NO'}`);
        } else {
            console.log('❌ User NOT Found by Hash.');

            console.log('Searching all users for similar decrypted emails or any email matches...');
            const allUsers = await User.find({});
            let foundCount = 0;
            for (const u of allUsers) {
                const decEmail = u.email; // Getter decrypter
                if (decEmail && decEmail.toLowerCase().includes('therazorsedge')) {
                    console.log(`⚠️ Match found! ID: ${u._id}`);
                    console.log(`   Decrypted Email: "${decEmail}"`);
                    console.log(`   Hash in DB: "${u.emailHash}"`);
                    console.log(`   Phone: "${u.phone}"`);
                    foundCount++;
                }
            }
            if (foundCount === 0) console.log('❌ No user found even with partial email search.');
        }

        await mongoose.disconnect();
    } catch (err) {
        console.error('Error:', err);
    }
}

checkUser();
