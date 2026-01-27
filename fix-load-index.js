const mongoose = require('mongoose');

// MongoDB URI
const MONGODB_URI = 'mongodb+srv://ahmadbinyounas:PSh6CCptfbr_Uha@cluster0.dex52.mongodb.net/?appName=Cluster0';

const fixLoadIndex = async () => {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('MongoDB Connected');

        const db = mongoose.connection.db;
        const collection = db.collection('loads');

        // Get all indexes
        const indexes = await collection.indexes();
        console.log('Current indexes:', indexes);

        // Drop the loadNumber index if it exists
        try {
            await collection.dropIndex('loadNumber_1');
            console.log('✅ Successfully dropped loadNumber_1 index');
        } catch (err) {
            if (err.code === 27) {
                console.log('ℹ️  loadNumber_1 index does not exist (already dropped)');
            } else {
                throw err;
            }
        }

        // Verify indexes after drop
        const newIndexes = await collection.indexes();
        console.log('Indexes after cleanup:', newIndexes);

        await mongoose.connection.close();
        console.log('\n✅ Database cleanup completed successfully!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Error:', err.message);
        process.exit(1);
    }
};

fixLoadIndex();
