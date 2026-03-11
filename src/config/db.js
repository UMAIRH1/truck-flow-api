const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI, {
            serverSelectionTimeoutMS: 5000, 
            connectTimeoutMS: 5000,
        });
        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`❌ MongoDB Connection Error: ${error.message}`);
        // Log extra help if it's a DNS/Whitelisting issue
        if (error.message.includes('querySrv ECONNREFUSED')) {
            console.error('🔍 TROUBLESHOOTING: This is usually a DNS or IP Whitelisting issue on MongoDB Atlas.');
        }
        process.exit(1);
    }
};

module.exports = connectDB;
