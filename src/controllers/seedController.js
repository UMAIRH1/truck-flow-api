const User = require('../models/User');
const bcrypt = require('bcryptjs');

// @desc    Seed manager account
// @route   GET /seed
// @access  Public (temporary - for easy deployment)
exports.seedManager = async (req, res) => {
    try {
        // Check if manager already exists
        const existingManager = await User.findOne({ email: 'manager@truckflow.com' });

        if (existingManager) {
            return res.status(200).json({
                success: true,
                message: 'Manager account already exists',
                credentials: {
                    email: 'manager@truckflow.com',
                    password: 'manager123',
                    note: 'Use these credentials to login'
                }
            });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('manager123', salt);

        // Create manager
        const manager = await User.create({
            name: 'Admin Manager',
            email: 'manager@truckflow.com',
            password: hashedPassword,
            phone: '+30 210 1234567',
            role: 'manager',
            preferredLanguage: 'en',
            country: 'Greece',
            isActive: true,
        });

        res.status(201).json({
            success: true,
            message: 'Manager account created successfully!',
            credentials: {
                email: 'manager@truckflow.com',
                password: 'manager123',
                warning: '⚠️ Change this password after first login!'
            },
            manager: {
                id: manager._id,
                name: manager.name,
                email: manager.email,
                role: manager.role
            }
        });
    } catch (err) {
        console.error('Seed error:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to seed manager account',
            error: err.message
        });
    }
};
