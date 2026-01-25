const Load = require('../models/Load');

// @desc    Get manager dashboard stats
// @route   GET /api/dashboard/manager
// @access  Private/Manager
exports.getManagerDashboard = async (req, res) => {
    try {
        // Total loads
        const totalLoads = await Load.countDocuments({ managerId: req.user._id });

        // Accepted loads
        const acceptedLoads = await Load.countDocuments({
            managerId: req.user._id,
            status: 'accepted',
        });

        // Completed loads
        const completedLoads = await Load.countDocuments({
            managerId: req.user._id,
            status: 'completed',
        });

        // Pending loads
        const pendingLoads = await Load.countDocuments({
            managerId: req.user._id,
            status: 'pending',
        });

        // Declined loads
        const declinedLoads = await Load.countDocuments({
            managerId: req.user._id,
            status: 'declined',
        });

        // Total income (completed loads)
        const completedLoadsList = await Load.find({
            managerId: req.user._id,
            status: 'completed',
        });
        const totalIncome = completedLoadsList.reduce((sum, load) => sum + load.loadAmount, 0);

        // Pending payments (accepted but not completed)
        const acceptedLoadsList = await Load.find({
            managerId: req.user._id,
            status: 'accepted',
        });
        const pendingPayments = acceptedLoadsList.reduce((sum, load) => sum + load.loadAmount, 0);

        res.status(200).json({
            success: true,
            dashboard: {
                totalLoads,
                acceptedLoads,
                completedLoads,
                pendingLoads,
                declinedLoads,
                totalIncome,
                pendingPayments,
            },
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Get driver dashboard stats
// @route   GET /api/dashboard/driver
// @access  Private/Driver
exports.getDriverDashboard = async (req, res) => {
    try {
        // Assigned loads (pending)
        const assignedLoads = await Load.countDocuments({
            driverId: req.user._id,
            status: 'pending',
        });

        // Accepted loads
        const acceptedLoads = await Load.countDocuments({
            driverId: req.user._id,
            status: 'accepted',
        });

        // Completed loads
        const completedLoads = await Load.countDocuments({
            driverId: req.user._id,
            status: 'completed',
        });

        // Declined loads
        const declinedLoads = await Load.countDocuments({
            driverId: req.user._id,
            status: 'declined',
        });

        // Total earnings (completed loads)
        const completedLoadsList = await Load.find({
            driverId: req.user._id,
            status: 'completed',
        });
        const totalEarnings = completedLoadsList.reduce((sum, load) => sum + load.loadAmount, 0);

        // Pending earnings (accepted but not completed)
        const acceptedLoadsList = await Load.find({
            driverId: req.user._id,
            status: 'accepted',
        });
        const pendingEarnings = acceptedLoadsList.reduce((sum, load) => sum + load.loadAmount, 0);

        res.status(200).json({
            success: true,
            dashboard: {
                assignedLoads,
                acceptedLoads,
                completedLoads,
                declinedLoads,
                totalEarnings,
                pendingEarnings,
            },
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
