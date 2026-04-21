const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { sendDriverInvitation } = require('../services/emailService');
const Load = require('../models/Load');

// @desc    Create driver (manager only)
// @route   POST /api/users
// @access  Private/Manager
exports.createDriver = async (req, res) => {
    try {
        const { name, email, phone, preferredLanguage } = req.body;

        // Validate required fields
        if (!name || !email || !phone) {
            return res.status(400).json({
                success: false,
                message: 'Please provide name, email, and phone',
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'User with this email already exists',
            });
        }

        // Create driver with temporary password
        const tempPassword = Math.random().toString(36).slice(-8);
        const driver = await User.create({
            name,
            email,
            password: tempPassword,
            phone,
            role: 'driver',
            preferredLanguage: preferredLanguage || 'en',
            isActive: false, // Inactive until password is set
        });

        // Generate setup token (valid for 24 hours)
        const setupToken = jwt.sign(
            { id: driver._id, email: driver.email, type: 'driver_setup' },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Send invitation email
        let emailSent = false;
        let emailError = null;
        try {
            await sendDriverInvitation(email, name, setupToken, driver.preferredLanguage);
            emailSent = true;
            console.log('✅ Driver invitation email sent successfully to:', email);
        } catch (error) {
            emailError = error.message;
            console.error('❌ Failed to send invitation email:', error);
            console.error('SMTP Config:', {
                host: process.env.SMTP_HOST,
                port: process.env.SMTP_PORT,
                user: process.env.SMTP_USER,
                hasPassword: !!process.env.SMTP_PASS,
                frontendUrl: process.env.FRONTEND_URL,
            });
        }

        res.status(201).json({
            success: true,
            message: emailSent 
                ? 'Driver created successfully. Invitation email sent.' 
                : 'Driver created successfully. Email sending failed - please send invitation manually.',
            emailSent,
            emailError: emailError || undefined,
            driver: {
                id: driver._id,
                name: driver.name,
                email: driver.email,
                phone: driver.phone,
                role: driver.role,
                isActive: driver.isActive,
                preferredLanguage: driver.preferredLanguage,
                createdAt: driver.createdAt,
            },
        });
    } catch (err) {
        console.error('❌ Create Driver Error:', err);
        res.status(500).json({ 
            success: false, 
            message: 'Server error: ' + err.message, 
            error: err.message 
        });
    }
};

// @desc    Get all drivers (manager only)
// @route   GET /api/users
// @access  Private/Manager
exports.getDrivers = async (req, res) => {
    try {
        const drivers = await User.find({ role: 'driver' })
            .select('-password')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: drivers.length,
            drivers,
        });
    } catch (err) {
        console.error('❌ Get Drivers Error:', err);
        res.status(500).json({ 
            success: false, 
            message: 'Server error: ' + err.message, 
            error: err.message 
        });
    }
};

// @desc    Get single driver (manager only)
// @route   GET /api/users/:id
// @access  Private/Manager
exports.getDriver = async (req, res) => {
    try {
        const driver = await User.findOne({
            _id: req.params.id,
            role: 'driver',
        }).select('-password');

        if (!driver) {
            return res.status(404).json({
                success: false,
                message: 'Driver not found',
            });
        }

        res.status(200).json({
            success: true,
            driver,
        });
    } catch (err) {
        console.error(err);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({
                success: false,
                message: 'Driver not found',
            });
        }
        console.error('❌ Get Driver Error:', err);
        res.status(500).json({ 
            success: false, 
            message: 'Server error: ' + err.message, 
            error: err.message 
        });
    }
};

// @desc    Toggle driver active status (manager only)
// @route   PATCH /api/users/:id/status
// @access  Private/Manager
exports.toggleDriverStatus = async (req, res) => {
    try {
        const driver = await User.findOne({
            _id: req.params.id,
            role: 'driver',
        });

        if (!driver) {
            return res.status(404).json({
                success: false,
                message: 'Driver not found',
            });
        }

        // Toggle status
        driver.isActive = !driver.isActive;
        await driver.save();

        res.status(200).json({
            success: true,
            message: `Driver ${driver.isActive ? 'activated' : 'deactivated'} successfully`,
            driver: {
                id: driver._id,
                name: driver.name,
                email: driver.email,
                isActive: driver.isActive,
            },
        });
    } catch (err) {
        console.error(err);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({
                success: false,
                message: 'Driver not found',
            });
        }
        console.error('❌ Toggle Driver Status Error:', err);
        res.status(500).json({ 
            success: false, 
            message: 'Server error: ' + err.message, 
            error: err.message 
        });
    }
};

// @desc    Delete driver (manager only)
// @route   DELETE /api/users/:id
// @access  Private/Manager
exports.deleteDriver = async (req, res) => {
    try {
        const driver = await User.findOne({
            _id: req.params.id,
            role: 'driver',
        });

        if (!driver) {
            return res.status(404).json({
                success: false,
                message: 'Driver not found',
            });
        }

        await driver.deleteOne();

        res.status(200).json({
            success: true,
            message: 'Driver deleted successfully',
        });
    } catch (err) {
        console.error(err);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({
                success: false,
                message: 'Driver not found',
            });
        }
        console.error('❌ Delete Driver Error:', err);
        res.status(500).json({ 
            success: false, 
            message: 'Server error: ' + err.message, 
            error: err.message 
        });
    }
};

// @desc    Update user profile (own profile)
// @route   PATCH /api/users/profile
// @access  Private
exports.updateProfile = async (req, res) => {
    try {
        const { name, email, phone, country, avatar, password, preferredLanguage } = req.body;
...
        // Update fields
        if (name) user.name = name;
        if (phone) user.phone = phone;
        if (country) user.country = country;
        if (avatar) user.avatar = avatar;
        if (preferredLanguage) user.preferredLanguage = preferredLanguage;
        if (password && password !== '••••••••••••') {
            user.password = password; // Will be hashed by pre-save hook
        }

        await user.save();

        res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                country: user.country,
                avatar: user.avatar,
                role: user.role,
                preferredLanguage: user.preferredLanguage,
            },
        });
    } catch (err) {
        console.error('❌ Update Profile Error:', err);
        res.status(500).json({ 
            success: false, 
            message: 'Server error: ' + err.message, 
            error: err.message 
        });
    }
};

// @desc    Get driver statistics (manager only)
// @route   GET /api/users/:id/stats
// @access  Private/Manager
exports.getDriverStats = async (req, res) => {
    try {
        const driverId = req.params.id;

        // Verify driver exists
        const driver = await User.findOne({ _id: driverId, role: 'driver' }).select('-password');
        if (!driver) {
            return res.status(404).json({
                success: false,
                message: 'Driver not found',
            });
        }

        // Aggregate load statistics
        const loads = await Load.find({ assignedDriver: driverId });

        const stats = {
            totalLoads: loads.length,
            completedLoads: loads.filter(l => l.status === 'completed').length,
            rejectedLoads: loads.filter(l => l.status === 'rejected').length,
            acceptedLoads: loads.filter(l => l.status === 'accepted').length,
            inProgressLoads: loads.filter(l => l.status === 'in-progress').length,
            pendingLoads: loads.filter(l => l.status === 'pending').length,
            totalEarnings: loads
                .filter(l => l.status === 'completed')
                .reduce((sum, l) => sum + (l.driverPrice || 0), 0),
            totalProfitGenerated: loads
                .filter(l => l.status === 'completed')
                .reduce((sum, l) => sum + (l.profit || 0), 0),
            recentLoads: loads.sort((a, b) => b.createdAt - a.createdAt).slice(0, 5).map(l => ({
                id: l._id,
                pickupLocation: l.pickupLocation,
                dropoffLocation: l.dropoffLocation,
                clientName: l.clientName,
                clientPrice: l.clientPrice,
                loadWeight: l.loadWeight,
                status: l.status,
                loadingDate: l.loadingDate,
                loadingTime: l.loadingTime
            }))
        };

        res.status(200).json({
            success: true,
            driver,
            stats
        });
    } catch (err) {
        console.error('❌ Get Driver Stats Error:', err);
        res.status(500).json({ 
            success: false, 
            message: 'Server error: ' + err.message, 
            error: err.message 
        });
    }
};
