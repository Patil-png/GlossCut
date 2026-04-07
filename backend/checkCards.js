const mongoose = require('mongoose');
const BarberCard = require('./models/BarberCard');
require('dotenv').config();

async function checkBarberCards() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/setkarr');
  
  const cards = await BarberCard.find({});
  console.log(`Total Barber Cards: ${cards.length}`);
  
  cards.forEach(card => {
    console.log(`Card: ${card.name}, Status: ${card.approvalStatus}, ShopId: ${card.shopId}`);
  });
  
  process.exit();
}

checkBarberCards();
