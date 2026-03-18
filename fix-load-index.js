/**
 * Fix Load Model Index Issue
 * 
 * This script drops the problematic loadNumber index that's causing duplicate key errors.
 * loadNumber is a virtual field and should not have a unique index.
 */

const mongoose = require('mongoose');
require('dotenv').config();

const fixLoadIndex = async () => {
  try {
    console.log('🔧 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    const loadsCollection = db.collection('loads');

    // Get all indexes
    console.log('\n📋 Current indexes on loads collection:');
    const indexes = await loadsCollection.indexes();
    indexes.forEach(index => {
      console.log(`  - ${index.name}:`, JSON.stringify(index.key));
    });

    // Check if loadNumber index exists
    const loadNumberIndex = indexes.find(idx => idx.key.loadNumber);
    
    if (loadNumberIndex) {
      console.log('\n🗑️  Dropping loadNumber index...');
      await loadsCollection.dropIndex('loadNumber_1');
      console.log('✅ loadNumber index dropped successfully');
    } else {
      console.log('\n✅ No loadNumber index found (already fixed)');
    }

    // Show final indexes
    console.log('\n📋 Final indexes on loads collection:');
    const finalIndexes = await loadsCollection.indexes();
    finalIndexes.forEach(index => {
      console.log(`  - ${index.name}:`, JSON.stringify(index.key));
    });

    console.log('\n✅ Index fix completed successfully!');
    console.log('You can now create loads without errors.');
    
  } catch (error) {
    console.error('❌ Error fixing index:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Disconnected from MongoDB');
    process.exit(0);
  }
};

fixLoadIndex();
