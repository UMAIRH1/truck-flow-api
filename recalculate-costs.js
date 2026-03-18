/**
 * Recalculate Costs Script
 * 
 * This script recalculates costs for all existing loads and routes
 * using the corrected cost calculation formulas.
 */

const mongoose = require('mongoose');
require('dotenv').config();
const Load = require('./src/models/Load');
const Route = require('./src/models/Route');

async function recalculateCosts() {
  try {
    console.log('🔧 Starting cost recalculation...\n');
    
    // Connect to MongoDB
    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Recalculate all loads
    console.log('📦 Recalculating LOADS...');
    const loads = await Load.find({});
    console.log(`   Found ${loads.length} loads`);
    
    let loadCount = 0;
    for (const load of loads) {
      await load.save(); // Triggers pre-save hook with new formula
      loadCount++;
      if (loadCount % 10 === 0) {
        console.log(`   Processed ${loadCount}/${loads.length} loads...`);
      }
    }
    console.log(`✅ All ${loads.length} loads recalculated\n`);

    // Recalculate all routes
    console.log('🚚 Recalculating ROUTES...');
    const routes = await Route.find({});
    console.log(`   Found ${routes.length} routes`);
    
    let routeCount = 0;
    for (const route of routes) {
      await route.save(); // Triggers pre-save hook with new formula
      routeCount++;
      if (routeCount % 10 === 0) {
        console.log(`   Processed ${routeCount}/${routes.length} routes...`);
      }
    }
    console.log(`✅ All ${routes.length} routes recalculated\n`);

    // Show summary
    console.log('📊 SUMMARY:');
    console.log(`   ✅ Loads recalculated: ${loads.length}`);
    console.log(`   ✅ Routes recalculated: ${routes.length}`);
    console.log(`   ✅ Total items: ${loads.length + routes.length}\n`);

    // Close connection
    await mongoose.connection.close();
    console.log('👋 Disconnected from MongoDB');
    console.log('✅ Cost recalculation completed successfully!\n');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error during recalculation:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the script
recalculateCosts();
