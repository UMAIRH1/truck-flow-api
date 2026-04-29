const mongoose = require('mongoose');
const Load = require('./src/models/Load');
const User = require('./src/models/User');
require('dotenv').config();

async function runDiagnostics() {
    try {
        console.log('--- DB DIAGNOSTICS START ---');
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/truckflow');
        console.log('✅ Connected to MongoDB');

        // 1. Check recent 5 loads
        const recentLoads = await Load.find().sort({ createdAt: -1 }).limit(5).populate('assignedDriver', 'name role').populate('broadcastTo', 'name role');
        console.log(`\n📦 RECENT LOADS (${recentLoads.length}):`);
        recentLoads.forEach(l => {
            const broadcastNames = l.broadcastTo.map(d => d.name || d._id).join(', ');
            console.log(`- Load ${l._id}: status=${l.status}, assigned=${l.assignedDriver ? l.assignedDriver.name : 'NONE'}, broadcast=[${broadcastNames}]`);
        });

        // 2. Check drivers
        const drivers = await User.find({ role: 'driver' }).limit(5);
        console.log(`\n👤 DRIVERS (${drivers.length} found):`);
        drivers.forEach(d => {
            console.log(`- Driver ${d._id}: name=${d.name}, role=${d.role}`);
        });

        console.log('\n--- DB DIAGNOSTICS END ---');
        process.exit(0);
    } catch (err) {
        console.error('❌ DIAGNOSTICS ERROR:', err);
        process.exit(1);
    }
}

runDiagnostics();
