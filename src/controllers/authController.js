const User = require('../models/User');
const OTP = require('../models/OTP');
const sendEmail = require('../utils/sendEmail');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res, next) => {
    try {
        const { name, email, password, phone, role, vehicleDetails } = req.body;

        // Check if user exists
        let user = await User.findOne({ email });

        if (user) {
            return res.status(400).json({ success: false, message: 'User already exists' });
        }

        // Create user (unverified)
        user = await User.create({
            name,
            email,
            password,
            phone,
            role,
            vehicleDetails: role === 'driver' ? vehicleDetails : undefined,
        });

        // Generate tokens
        const accessToken = user.getSignedJwtToken();
        const refreshToken = user.getRefreshJwtToken();

        // Auto-verify for testing (since no email service)
        user.isVerified = true;
        user.refreshToken = refreshToken;
        await user.save();

        // Generate OTP (for testing verify-otp endpoint)
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // Save OTP to DB
        await OTP.create({ email, otp });

        // Send OTP via email (attempt, but don't fail)
        try {
            await sendEmail({
                email: user.email,
                subject: 'Account Verification OTP',
                message: `Your verification code is ${otp}. It will expire in 10 minutes.`,
            });
        } catch (err) {
            console.log('Email delivery failed, but proceeding for testing...');
        }

        res.status(201).json({
            success: true,
            message: 'User registered. OTP and Tokens included for testing.',
            userId: user._id,
            otp, // Included for testing
            token: accessToken, // Included for testing
            refreshToken, // Included for testing
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: err.message });
    }
};

// @desc    Verify OTP
// @route   POST /api/auth/verify-otp
// @access  Public
exports.verifyOtp = async (req, res, next) => {
    try {
        const { email, otp } = req.body;

        const otpRecord = await OTP.findOne({ email, otp });

        if (!otpRecord) {
            return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        if (!user.isVerified) {
            user.isVerified = true;
        }

        // Generate tokens
        const accessToken = user.getSignedJwtToken();
        const refreshToken = user.getRefreshJwtToken();

        // Save refresh token to DB
        user.refreshToken = refreshToken;
        await user.save();

        // Delete OTP record
        await OTP.deleteOne({ _id: otpRecord._id });

        res.status(200).json({
            success: true,
            message: 'OTP verified successfully',
            token: accessToken,
            refreshToken,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: err.message });
    }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // Check for user
        const user = await User.findOne({ email }).select('+password');

        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        // Check if verified
        if (!user.isVerified) {
            return res.status(401).json({ success: false, message: 'Please verify your email first' });
        }

        // Check if password matches
        const isMatch = await user.matchPassword(password);

        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        // Generate tokens
        const accessToken = user.getSignedJwtToken();
        const refreshToken = user.getRefreshJwtToken();

        // Save refresh token to DB
        user.refreshToken = refreshToken;
        await user.save();

        res.status(200).json({
            success: true,
            userId: user._id,
            token: accessToken,
            refreshToken,
            role: user.role,
            profile: {
                name: user.name,
                email: user.email,
                phone: user.phone,
                vehicleDetails: user.vehicleDetails
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: err.message });
    }
};

// @desc    Refresh Token
// @route   POST /api/auth/refresh-token
// @access  Public
exports.refreshToken = async (req, res, next) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(400).json({ success: false, message: 'Refresh token is required' });
        }

        // Verify refresh token
        let decoded;
        try {
            decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
        } catch (err) {
            return res.status(401).json({ success: false, message: 'Invalid or expired refresh token' });
        }

        // Find user and check if token matches
        const user = await User.findById(decoded.id);

        if (!user || user.refreshToken !== refreshToken) {
            return res.status(401).json({ success: false, message: 'Invalid refresh token' });
        }

        // Generate new access token
        const accessToken = user.getSignedJwtToken();

        res.status(200).json({
            success: true,
            token: accessToken,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: err.message });
    }
};

// @desc    Logout / Clear refresh token
// @route   POST /api/auth/logout
// @access  Public
exports.logout = async (req, res, next) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(400).json({ success: false, message: 'Refresh token is required' });
        }

        const user = await User.findOne({ refreshToken });

        if (user) {
            user.refreshToken = undefined;
            await user.save();
        }

        res.status(200).json({ success: true, message: 'Logged out successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: err.message });
    }
};

// @desc    Forgot Password
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res, next) => {
    try {
        const { email } = req.body;

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Generate OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // Save OTP
        await OTP.create({ email, otp });

        // Send Email (attempt)
        try {
            await sendEmail({
                email,
                subject: 'Password Reset OTP',
                message: `Your password reset code is ${otp}. It will expire in 10 minutes.`,
            });
        } catch (err) {
            console.log('Email delivery failed, but proceeding for testing...');
        }

        res.status(200).json({
            success: true,
            message: 'OTP sent (also returned here for testing)',
            otp // Included for testing
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: err.message });
    }
};
