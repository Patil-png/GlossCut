const axios = require('axios');
const HF_TOKEN = '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';

const models = [
  'fahd9999/face_shape_classification',
  'metadome/face_shape_classification'
];

async function test() {
  for (const model of models) {
    const url = `https://router.huggingface.co/hf-inference/models/${model}`;
    try {
      console.log(`Testing ${model}...`);
      const response = await axios.post(url, {}, {
        headers: { 
          Authorization: `Bearer ${HF_TOKEN}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });
      console.log(`✅ ${model} returned ${response.status}`);
    } catch (error) {
      console.log(`❌ ${model} returned ${error.response?.status || error.message}`);
      if (error.response?.data) {
          console.log(`   Response Data:`, JSON.stringify(error.response.data));
      }
    }
  }
}

test();
