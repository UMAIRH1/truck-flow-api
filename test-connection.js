// Quick MongoDB Connection Test
require('dotenv').config();
const mongoose = require('mongoose');

console.log('========================================');
console.log('MongoDB Connection Test');
console.log('========================================');
console.log('Testing connection to:', process.env.MONGODB_URI?.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@'));
console.log('');

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ SUCCESS! MongoDB Connected');
    console.log('Database:', mongoose.connection.name);
    console.log('Host:', mongoose.connection.host);
    console.log('');
    console.log('Your MongoDB connection is working!');
    process.exit(0);
  })
  .catch((err) => {
    console.log('❌ FAILED! MongoDB Connection Error');
    console.log('');
    console.log('Error:', err.message);
    console.log('');
    
    if (err.message.includes('ETIMEOUT') || err.message.includes('queryTxt')) {
      console.log('🔍 Diagnosis: DNS Resolution Issue');
      console.log('');
      console.log('Solutions:');
      console.log('1. Change DNS to Google DNS (8.8.8.8 and 8.8.4.4)');
      console.log('2. Run: ipconfig /flushdns');
      console.log('3. Use local MongoDB: MONGODB_URI=mongodb://localhost:27017/truckflow');
      console.log('');
      console.log('See fix-mongodb-connection.md for detailed instructions');
    } else if (err.message.includes('authentication')) {
      console.log('🔍 Diagnosis: Authentication Issue');
      console.log('Check your username and password in .env file');
    } else {
      console.log('🔍 Diagnosis: Unknown Error');
      console.log('Full error:', err);
    }
    
    process.exit(1);
  });
