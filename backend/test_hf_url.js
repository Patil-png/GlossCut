const axios = require('axios');
const HF_TOKEN = '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';

const urls = [
  'https://huggingface.co/api/models/Salesforce/blip-image-captioning-large/inference',
  'https://api-inference.huggingface.co/Salesforce/blip-image-captioning-large',
  'https://router.huggingface.co/hf-inference/v1/chat/completions',
  'https://router.huggingface.co/hf-inference/models/meta-llama/Llama-2-7b-chat-hf'
];

async function test() {
  for (const url of urls) {
    try {
      console.log(`Testing ${url}...`);
      const response = await axios.post(url, {}, {
        headers: { Authorization: `Bearer ${HF_TOKEN}` },
        timeout: 5000
      });
      console.log(`✅ ${url} returned ${response.status}`);
    } catch (error) {
      console.log(`❌ ${url} returned ${error.response?.status || error.message}`);
      if (error.response?.headers['x-error-message']) {
        console.log(`   Error message: ${error.response.headers['x-error-message']}`);
      }
    }
  }
}

test();
