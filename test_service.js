const { calculateRouteDistance } = require('./src/services/geocodeService');
const dotenv = require('dotenv');
dotenv.config();

async function testService() {
  const pickup = '31.465678,74.26020679999999';
  const dropoff = '31.4687,74.2721';

  try {
    console.log('🧪 Testing geocodeService directly...');
    const result = await calculateRouteDistance(pickup, dropoff);
    console.log('✅ Result:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testService();
