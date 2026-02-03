const User = require('../models/User');
const OTP = require('../models/OTP');
const jwt = require('jsonwebtoken');
const { sendPasswordResetOTP } = require('../services/emailService');

// Generate 6-digit OTP
const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate email & password
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: req.t('validation.emailRequired') + ' and ' + req.t('validation.passwordRequired'),
            });
        }

        // Check for user
        const user = await User.findOne({ email }).select('+password');

        if (!user) {
            return res.status(401).json({
                success: false,
                message: req.t('auth.invalidCredentials'),
            });
        }

        // Check if user is active
        if (!user.isActive) {
            return res.status(401).json({
                success: false,
                message: 'Your account has been deactivated. Contact your manager.',
            });
        }

        // Check if password matches
        const isMatch = await user.matchPassword(password);

        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: req.t('auth.invalidCredentials'),
            });
        }

        // Generate tokens
        const accessToken = user.getSignedJwtToken();
        const refreshToken = user.getRefreshJwtToken();

        res.status(200).json({
            success: true,
            token: accessToken,
            refreshToken,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role,
                preferredLanguage: user.preferredLanguage,
            },
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);

        res.status(200).json({
            success: true,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role,
                preferredLanguage: user.preferredLanguage,
                createdAt: user.createdAt,
            },
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Refresh access token
// @route   POST /api/auth/refresh-token
// @access  Public
exports.refreshToken = async (req, res) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(400).json({
                success: false,
                message: 'Refresh token is required',
            });
        }

        // Verify refresh token
        let decoded;
        try {
            decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
        } catch (err) {
            return res.status(401).json({
                success: false,
                message: 'Invalid or expired refresh token',
            });
        }

        // Find user
        const user = await User.findById(decoded.id);

        if (!user || !user.isActive) {
            return res.status(401).json({
                success: false,
                message: 'User not found or inactive',
            });
        }

        // Generate new access token
        const accessToken = user.getSignedJwtToken();

        res.status(200).json({
            success: true,
            token: accessToken,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Logout (client-side token removal, optional server logging)
// @route   POST /api/auth/logout
// @access  Public
exports.logout = async (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Logged out successfully',
    });
};

// @desc    Request password reset OTP
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Please provide email',
            });
        }

        // Check if user exists
        const user = await User.findOne({ email: email.toLowerCase() });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'No account found with this email',
            });
        }

        // Generate OTP
        const otp = generateOTP();

        // Save OTP to database
        await OTP.create({
            email: email.toLowerCase(),
            otp,
            type: 'password_reset',
            expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
        });

        // Send OTP via email
        await sendPasswordResetOTP(email, otp, user.name);

        res.status(200).json({
            success: true,
            message: 'OTP sent to your email',
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to send OTP. Please try again.' 
        });
    }
};

// @desc    Verify OTP and reset password
// @route   POST /api/auth/reset-password
// @access  Public
exports.resetPassword = async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;

        if (!email || !otp || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Please provide email, OTP, and new password',
            });
        }

        // Validate password length
        if (newPassword.length < 8) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 8 characters',
            });
        }

        // Find valid OTP
        const otpRecord = await OTP.findOne({
            email: email.toLowerCase(),
            otp,
            type: 'password_reset',
            used: false,
            expiresAt: { $gt: new Date() },
        });

        if (!otpRecord) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired OTP',
            });
        }

        // Find user
        const user = await User.findOne({ email: email.toLowerCase() });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }

        // Update password
        user.password = newPassword;
        await user.save();

        // Mark OTP as used
        otpRecord.used = true;
        await otpRecord.save();

        res.status(200).json({
            success: true,
            message: 'Password reset successfully',
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to reset password. Please try again.' 
        });
    }
};


// @desc    Setup password for new driver
// @route   POST /api/auth/setup-password
// @access  Public (with token)
exports.setupPassword = async (req, res) => {
    try {
        const { token, password } = req.body;

        if (!token || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide token and password',
            });
        }

        // Validate password length
        if (password.length < 8) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 8 characters',
            });
        }

        // Verify token
        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch (err) {
            return res.status(401).json({
                success: false,
                message: 'Invalid or expired token',
            });
        }

        // Check token type
        if (decoded.type !== 'driver_setup') {
            return res.status(401).json({
                success: false,
                message: 'Invalid token type',
            });
        }

        // Find user
        const user = await User.findById(decoded.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }

        // Update password and activate account
        user.password = password;
        user.isActive = true;
        await user.save();

        // Generate login tokens
        const accessToken = user.getSignedJwtToken();
        const refreshToken = user.getRefreshJwtToken();

        res.status(200).json({
            success: true,
            message: 'Password set successfully',
            token: accessToken,
            refreshToken,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role,
                preferredLanguage: user.preferredLanguage,
            },
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to setup password. Please try again.' 
        });
    }
};
