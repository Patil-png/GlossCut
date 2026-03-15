const mongoose = require('mongoose');
const GlobalSettings = require('./backend/models/GlobalSettings');
const Shop = require('./backend/models/Shop');

async function testSettings() {
    try {
        await mongoose.connect('mongodb://localhost:27017/setkarr_test');
        console.log('Connected to test DB');

        // Clean up
        await GlobalSettings.deleteMany({});
        await Shop.deleteMany({});

        // Create dummy shops
        const shop1 = new Shop({ name: 'Shop 1', owner: new mongoose.Types.ObjectId(), address: 'Addr 1', phone: '123' });
        const shop2 = new Shop({ name: 'Shop 2', owner: new mongoose.Types.ObjectId(), address: 'Addr 2', phone: '456' });
        const shop3 = new Shop({ name: 'Shop 3', owner: new mongoose.Types.ObjectId(), address: 'Addr 3', phone: '789' });
        const shop4 = new Shop({ name: 'Shop 4', owner: new mongoose.Types.ObjectId(), address: 'Addr 4', phone: '000' });
        
        await Promise.all([shop1.save(), shop2.save(), shop3.save(), shop4.save()]);
        console.log('Created dummy shops');

        // Test Creation
        let settings = new GlobalSettings({
            featuredShopIds: [shop1._id, shop2._id, shop3._id]
        });
        await settings.save();
        console.log('Saved settings with 3 shops');

        // Verify Population
        const populatedSettings = await GlobalSettings.findOne().populate('featuredShopIds');
        console.log('Populated Shops:', populatedSettings.featuredShopIds.map(s => s.name));
        
        if (populatedSettings.featuredShopIds.length !== 3) {
            console.error('Failed: Expected 3 shops');
        } else {
            console.log('Success: Correct number of shops populated');
        }

        await mongoose.disconnect();
    } catch (err) {
        console.error('Test Error:', err);
    }
}

// Mocking some dependencies because the real project uses encryption set/get
// This test script is just for schema validation and population logic
testSettings();
