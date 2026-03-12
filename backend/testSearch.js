const mongoose = require('mongoose');
const h3 = require('h3-js');
const Shop = require('./models/Shop');
require('dotenv').config({ path: './.env' });

async function test() {
  await mongoose.connect(process.env.MONGO_URI);
  const shops = await Shop.find({ approvalStatus: 'approved' }).select('name location h3Index');
  console.log("Found shops:", shops.length);
  
  if (shops.length > 0) {
    const testLat = shops[0].location.coordinates[1];
    const testLng = shops[0].location.coordinates[0];
    console.log(`Testing with coordinates of first shop: [${testLat}, ${testLng}]`);
    
    for (let r = 1; r <= 5; r++) {
       const rings = h3.gridDisk(h3.latLngToCell(testLat, testLng, 9), r);
       console.log(`Ring ${r} has ${rings.length} hexes. Contains target?`, rings.includes(shops[0].h3Index));
    }
  }
  process.exit();
}
test();
