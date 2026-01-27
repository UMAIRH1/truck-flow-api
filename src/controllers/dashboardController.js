const Load = require('../models/Load');

// @desc    Get manager dashboard stats
// @route   GET /api/dashboard/manager
// @access  Private/Manager
exports.getManagerDashboard = async (req, res) => {
    try {
        // Total loads
        const totalLoads = await Load.countDocuments({ createdBy: req.user._id });

        // Accepted loads
        const acceptedLoads = await Load.countDocuments({
            createdBy: req.user._id,
            status: 'accepted',
        });

        // Completed loads
        const completedLoads = await Load.countDocuments({
            createdBy: req.user._id,
            status: 'completed',
        });

        // Pending loads
        const pendingLoads = await Load.countDocuments({
            createdBy: req.user._id,
            status: 'pending',
        });

        // Rejected loads
        const rejectedLoads = await Load.countDocuments({
            createdBy: req.user._id,
            status: 'rejected',
        });

        // Total income (completed loads - using clientPrice)
        const completedLoadsList = await Load.find({
            createdBy: req.user._id,
            status: 'completed',
        });
        const totalIncome = completedLoadsList.reduce((sum, load) => sum + (load.clientPrice || 0), 0);

        // Pending payments (accepted but not completed)
        const acceptedLoadsList = await Load.find({
            createdBy: req.user._id,
            status: 'accepted',
        });
        const pendingPayments = acceptedLoadsList.reduce((sum, load) => sum + (load.clientPrice || 0), 0);

        res.status(200).json({
            success: true,
            dashboard: {
                totalLoads,
                acceptedLoads,
                completedLoads,
                pendingLoads,
                rejectedLoads,
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
            assignedDriver: req.user._id,
            status: 'pending',
        });

        // Accepted loads
        const acceptedLoads = await Load.countDocuments({
            assignedDriver: req.user._id,
            status: 'accepted',
        });

        // Completed loads
        const completedLoads = await Load.countDocuments({
            assignedDriver: req.user._id,
            status: 'completed',
        });

        // Rejected loads
        const rejectedLoads = await Load.countDocuments({
            assignedDriver: req.user._id,
            status: 'rejected',
        });

        // Total earnings (completed loads - using driverPrice)
        const completedLoadsList = await Load.find({
            assignedDriver: req.user._id,
            status: 'completed',
        });
        const totalEarnings = completedLoadsList.reduce((sum, load) => sum + (load.driverPrice || 0), 0);

        // Pending earnings (accepted but not completed)
        const acceptedLoadsList = await Load.find({
            assignedDriver: req.user._id,
            status: 'accepted',
        });
        const pendingEarnings = acceptedLoadsList.reduce((sum, load) => sum + (load.driverPrice || 0), 0);

        res.status(200).json({
            success: true,
            dashboard: {
                assignedLoads,
                acceptedLoads,
                completedLoads,
                rejectedLoads,
                totalEarnings,
                pendingEarnings,
            },
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
