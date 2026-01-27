const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

let seeded = false;

/**
 * Middleware to auto-seed manager account on first API request
 * This is a temporary solution - runs seed on first API hit
 */
const autoSeedMiddleware = async (req, res, next) => {
    // Skip if already seeded
    if (seeded) {
        return next();
    }

    try {
        console.log('🌱 Auto-seeding manager account...');

        // Define User schema inline
        const userSchema = new mongoose.Schema({
            name: String,
            email: { type: String, unique: true },
            password: String,
            phone: String,
            role: { type: String, enum: ['manager', 'driver'], default: 'driver' },
            isActive: { type: Boolean, default: true },
            preferredLanguage: { type: String, enum: ['en', 'el'], default: 'en' },
            country: { type: String, default: 'Greece' },
            avatar: { type: String, default: '' },
        }, { timestamps: true });

        const User = mongoose.models.User || mongoose.model('User', userSchema);

        // Check if manager already exists
        const existingManager = await User.findOne({ email: 'manager@truckflow.com' });

        if (existingManager) {
            console.log('✅ Manager account already exists');
            seeded = true;
            return next();
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('manager123', salt);

        // Create manager
        await User.create({
            name: 'Admin Manager',
            email: 'manager@truckflow.com',
            password: hashedPassword,
            phone: '+30 210 1234567',
            role: 'manager',
            preferredLanguage: 'en',
            country: 'Greece',
            isActive: true,
        });

        console.log('✅ Manager account created successfully!');
        console.log('📧 Email: manager@truckflow.com');
        console.log('🔑 Password: manager123');
        
        seeded = true;
        next();
    } catch (err) {
        console.error('❌ Auto-seed error:', err.message);
        // Don't block the request even if seed fails
        seeded = true; // Mark as attempted to avoid retry on every request
        next();
    }
};

module.exports = autoSeedMiddleware;
