const mongoose = require('mongoose');
const Load = require('./src/models/Load');
require('dotenv').config();

async function runCheck() {
    try {
        console.log('Connecting...');
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/truckflow', {
            serverSelectionTimeoutMS: 5000
        });
        console.log('Connected!');

        const count = await Load.countDocuments();
        console.log('Total Loads:', count);

        const latest = await Load.find().sort({ createdAt: -1 }).limit(3);
        latest.forEach(v => {
            console.log(`ID: ${v._id}`);
            console.log(`Status: ${v.status}`);
            console.log(`Assigned: ${v.assignedDriver}`);
            console.log(`Broadcast: ${JSON.stringify(v.broadcastTo)}`);
            console.log('---');
        });

        process.exit(0);
    } catch (err) {
        console.error('ERROR:', err);
        process.exit(1);
    }
}

runCheck();
