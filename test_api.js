const axios = require('axios');

async function testApi() {
  const url = 'http://localhost:5000/api/loads/calculate-distance';
  const data = {
    pickupLocation: '31.465678,74.26020679999999',
    dropoffLocation: '31.4687,74.2721',
    waypoints: []
  };

  try {
    console.log('🚀 Sending request to:', url);
    const response = await axios.post(url, data);
    console.log('✅ Response:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('❌ Error:', error.response?.data?.message || error.message);
  }
}

testApi();
