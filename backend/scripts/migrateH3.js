const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { latLngToCell } = require('h3-js');
const Shop = require('../models/Shop');

async function migrate() {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(process.env.MONGO_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
    });
    console.log('✅ Connected to MongoDB');

    console.log('Fetching all shops...');
    const shops = await Shop.find({ 'location.coordinates': { $exists: true, $ne: [] } });
    console.log(`Found ${shops.length} shops with location coordinates.`);

    let updatedCount = 0;
    let errorCount = 0;

    for (let shop of shops) {
      try {
        const [lng, lat] = shop.location.coordinates;
        if (lng != null && lat != null && !isNaN(lng) && !isNaN(lat)) {
          const h3Index = latLngToCell(lat, lng, 9);
          
          if (shop.h3Index !== h3Index) {
            shop.h3Index = h3Index;
            await shop.save({ timestamps: false }); // Avoid updating timestamps just for migration
            updatedCount++;
            if (updatedCount % 50 === 0) {
              console.log(`Progress: Updated ${updatedCount} shops...`);
            }
          }
        } else {
          console.warn(`⚠️ Shop ${shop._id} has invalid coordinates: [${lng}, ${lat}]`);
          errorCount++;
        }
      } catch (err) {
        console.error(`❌ Error updating shop ${shop._id}:`, err.message);
        errorCount++;
      }
    }

    console.log('====================================');
    console.log('🎉 Migration Completed Successfully!');
    console.log(`Total Shops Processed: ${shops.length}`);
    console.log(`Shops Updated: ${updatedCount}`);
    console.log(`Shops with Errors: ${errorCount}`);
    console.log('====================================');
    process.exit(0);

  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  }
}

migrate();
