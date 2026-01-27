const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Vercel serverless function for seeding
module.exports = async (req, res) => {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ 
            success: false, 
            message: 'Method not allowed. Use POST.' 
        });
    }

    // Simple authentication - use a secret key
    const { secret } = req.body;
    if (secret !== process.env.SEED_SECRET) {
        return res.status(401).json({ 
            success: false, 
            message: 'Unauthorized. Invalid secret.' 
        });
    }

    try {
        // Connect to MongoDB
        if (mongoose.connection.readyState === 0) {
            await mongoose.connect(process.env.MONGO_URI);
        }

        // Define User schema
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

        // Check if manager exists
        const existingManager = await User.findOne({ email: 'manager@truckflow.com' });

        if (existingManager) {
            return res.status(200).json({
                success: true,
                message: 'Manager account already exists',
                credentials: {
                    email: 'manager@truckflow.com',
                    password: 'manager123'
                }
            });
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

        return res.status(201).json({
            success: true,
            message: 'Manager account created successfully',
            credentials: {
                email: 'manager@truckflow.com',
                password: 'manager123'
            },
            warning: 'Change the password after first login!'
        });

    } catch (error) {
        console.error('Seed error:', error);
        return res.status(500).json({
            success: false,
            message: 'Seed failed',
            error: error.message
        });
    }
};
