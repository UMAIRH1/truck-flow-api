/**
 * Seed script to create the first manager account
 * Run: node src/scripts/seedManager.js
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load env vars
dotenv.config({ path: path.join(__dirname, '../../.env') });

const User = require('../models/User');

const seedManager = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB Connected');

        // Check if manager already exists
        const existingManager = await User.findOne({ role: 'manager' });

        if (existingManager) {
            console.log('Manager already exists:', existingManager.email);
            process.exit(0);
        }

        // Create manager
        const manager = await User.create({
            name: 'Admin Manager',
            email: 'manager@truckflow.com',
            password: 'manager123', // Change this in production!
            phone: '+30 210 1234567',
            role: 'manager',
            preferredLanguage: 'en',
        });

        console.log('Manager created successfully!');
        console.log('Email:', manager.email);
        console.log('Password: manager123');
        console.log('\n⚠️  Change the password after first login!');

        process.exit(0);
    } catch (err) {
        console.error('Error:', err.message);
        process.exit(1);
    }
};

seedManager();
