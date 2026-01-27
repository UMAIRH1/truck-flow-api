const mongoose = require('mongoose');

// MongoDB URI
const MONGODB_URI = 'mongodb+srv://ahmadbinyounas:PSh6CCptfbr_Uha@cluster0.dex52.mongodb.net/?appName=Cluster0';

const cleanupIndexes = async () => {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('MongoDB Connected');

        const db = mongoose.connection.db;
        const collection = db.collection('loads');

        // Get all indexes
        const indexes = await collection.indexes();
        console.log('Current indexes:', indexes);

        // Drop old indexes that reference old field names
        const indexesToDrop = ['managerId_1_status_1', 'driverId_1_status_1'];
        
        for (const indexName of indexesToDrop) {
            try {
                await collection.dropIndex(indexName);
                console.log(`✅ Successfully dropped ${indexName} index`);
            } catch (err) {
                if (err.code === 27) {
                    console.log(`ℹ️  ${indexName} index does not exist (already dropped)`);
                } else {
                    console.log(`⚠️  Could not drop ${indexName}:`, err.message);
                }
            }
        }

        // Verify indexes after drop
        const newIndexes = await collection.indexes();
        console.log('\nIndexes after cleanup:', newIndexes);

        await mongoose.connection.close();
        console.log('\n✅ Database cleanup completed successfully!');
        console.log('You can now create loads without errors.');
        process.exit(0);
    } catch (err) {
        console.error('❌ Error:', err.message);
        process.exit(1);
    }
};

cleanupIndexes();
