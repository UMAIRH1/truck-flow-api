const mongoose = require('mongoose');
const Load = require('./src/models/Load');
require('dotenv').config();

async function checkLoads() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/truckflow');
        console.log('Connected!');
        
        const loads = await Load.find({});
        console.log(`Total loads in DB: ${loads.length}`);
        
        const broadcastLoads = loads.filter(l => l.broadcastTo && l.broadcastTo.length > 0);
        console.log(`Loads with broadcastTo: ${broadcastLoads.length}`);
        
        broadcastLoads.forEach(l => {
            console.log(`- Load ${l._id}: broadcastTo=[${l.broadcastTo.join(', ')}]`);
        });

        process.exit(0);
    } catch (err) {
        console.error('ERROR:', err);
        process.exit(1);
    }
}

checkLoads();
