const mongoose = require('mongoose');
const Shop = require('./models/Shop');
require('dotenv').config();

async function checkShops() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/setkarr');
  
  const approvedShops = await Shop.find({ approvalStatus: 'approved' });
  console.log(`Total Approved Shops: ${approvedShops.length}`);
  
  approvedShops.forEach(shop => {
    console.log(`Shop: ${shop.name}, Category: ${shop.category}, Status: ${shop.approvalStatus}, Has Location: ${!!shop.location}, H3: ${shop.h3Index}`);
  });
  
  process.exit();
}

checkShops();
