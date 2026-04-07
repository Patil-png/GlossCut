const axios = require('axios');

async function testFetch() {
  try {
    const res = await axios.get('http://localhost:5000/api/shop/all');
    console.log(`Fetched Shops without limit: ${res.data.length}`);
    
    const resLimit = await axios.get('http://localhost:5000/api/shop/all?limit=100');
    console.log(`Fetched Shops with limit 100: ${resLimit.data.length}`);
  } catch (err) {
    console.error(err.message);
  }
}

testFetch();
