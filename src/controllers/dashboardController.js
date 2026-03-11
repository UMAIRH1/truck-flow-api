const Load = require('../models/Load');
const Route = require('../models/Route');

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

        // In Progress loads
        const inProgressLoads = await Load.countDocuments({
            createdBy: req.user._id,
            status: 'in-progress',
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

        // Accepted/In-progress loadsList for pending payments calculation
        const pendingPaymentsLoads = await Load.find({
            createdBy: req.user._id,
            status: { $in: ['accepted', 'in-progress'] },
        });
        const pendingPayments = pendingPaymentsLoads.reduce((sum, load) => sum + (load.clientPrice || 0), 0);

        // --- Phase 2: Route-based KPIs ---
        const completedRoutes = await Route.find({
            createdBy: req.user._id,
            status: 'completed'
        }).sort({ updatedAt: -1 });

        const recentProfitRoutes = (completedRoutes || []).map(r => ({
            id: r._id,
            name: r.routeName,
            profit: r.profit || 0,
            date: r.updatedAt
        })).slice(0, 5);

        const totalRevenue = completedRoutes.reduce((sum, r) => sum + (r.totalRevenue || 0), 0);
        const totalCost = completedRoutes.reduce((sum, r) => sum + (r.totalCost || 0), 0);
        const totalProfit = completedRoutes.reduce((sum, r) => sum + (r.profit || 0), 0);
        const totalDistance = completedRoutes.reduce((sum, r) => sum + (r.totalDistance || 0), 0);

        const avgRevenuePerKm = totalDistance > 0 ? totalRevenue / totalDistance : 0;
        const avgProfitPerKm = totalDistance > 0 ? totalProfit / totalDistance : 0;

        // Profit per Driver
        const profitPerDriver = completedRoutes.reduce((acc, r) => {
            const driverId = r.assignedDriver.toString();
            if (!acc[driverId]) acc[driverId] = { name: '', profit: 0 };
            acc[driverId].profit += (r.profit || 0);
            return acc;
        }, {});

        // Profit per Truck
        const profitPerTruck = completedRoutes.reduce((acc, r) => {
            const truckNum = r.assignedTruck?.truckNumber || 'Unknown';
            if (!acc[truckNum]) acc[truckNum] = 0;
            acc[truckNum] += (r.profit || 0);
            return acc;
        }, {});

        res.status(200).json({
            success: true,
            dashboard: {
                totalLoads,
                acceptedLoads,
                inProgressLoads,
                completedLoads,
                pendingLoads,
                rejectedLoads,
                totalIncome: totalRevenue, // Client wants "Total Revenue"
                totalRevenue,
                totalCost,
                totalProfit,
                pendingPayments,
                avgRevenuePerKm: Math.round(avgRevenuePerKm * 100) / 100,
                avgProfitPerKm: Math.round(avgProfitPerKm * 100) / 100,
                profitPerDriver,
                profitPerTruck,
                recentProfitRoutes
            },
        });
    } catch (err) {
        console.error('❌ Manager Dashboard Error:', err);
        res.status(500).json({ 
            success: false, 
            message: 'Server error: ' + err.message, 
            error: err.message 
        });
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

        // In Progress loads
        const inProgressLoads = await Load.countDocuments({
            assignedDriver: req.user._id,
            status: 'in-progress',
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

        // Pending earnings (accepted/in-progress but not completed)
        const pendingEarningsLoads = await Load.find({
            assignedDriver: req.user._id,
            status: { $in: ['accepted', 'in-progress'] },
        });
        const pendingEarnings = pendingEarningsLoads.reduce((sum, load) => sum + (load.driverPrice || 0), 0);

        res.status(200).json({
            success: true,
            dashboard: {
                assignedLoads,
                acceptedLoads,
                inProgressLoads,
                completedLoads,
                rejectedLoads,
                totalEarnings,
                pendingEarnings,
            },
        });
    } catch (err) {
        console.error('❌ Driver Dashboard Error:', err);
        res.status(500).json({ 
            success: false, 
            message: 'Server error: ' + err.message, 
            error: err.message 
        });
    }
};
