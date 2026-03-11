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

        // --- Summary Workload Aggregation (Loads) ---
        // We calculate core KPIs from the Loads directly to ensure stand-alone loads are counted.
        // We use the 'completed' status to determine finalized revenue/profit.
        const completedLoadsForStats = await Load.find({
            createdBy: req.user._id,
            status: 'completed'
        }).populate('assignedDriver', 'name');

        const totalLoadRevenue = completedLoadsForStats.reduce((sum, l) => sum + (l.clientPrice || 0), 0);
        
        // Use the 'profit' field calculated by the Load model pre-save hook
        const totalLoadProfit = completedLoadsForStats.reduce((sum, l) => sum + (l.profit || 0), 0);
        
        // Sum total cost from loads
        const totalLoadCost = completedLoadsForStats.reduce((sum, l) => sum + (l.totalCost || 0), 0);

        // Calculate Profit per Driver from all completed loads
        const profitPerDriver = completedLoadsForStats.reduce((acc, l) => {
            if (l.assignedDriver) {
                const driverId = l.assignedDriver._id.toString();
                const driverName = l.assignedDriver.name || 'Unknown Driver';
                if (!acc[driverId]) acc[driverId] = { name: driverName, profit: 0 };
                acc[driverId].profit += (l.profit || 0);
            }
            return acc;
        }, {});

        // Round driver profits
        Object.keys(profitPerDriver).forEach(id => {
            profitPerDriver[id].profit = Math.round(profitPerDriver[id].profit * 100) / 100;
        });

        // --- Route-specific KPIs ---
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

        // Profit per Truck (Routes only for now as Load has no truck field)
        const profitPerTruck = completedRoutes.reduce((acc, r) => {
            const truckNum = r.assignedTruck?.truckNumber || 'Unknown Truck';
            if (!acc[truckNum]) acc[truckNum] = 0;
            acc[truckNum] += (r.profit || 0);
            return acc;
        }, {});

        // Round truck profits
        Object.keys(profitPerTruck).forEach(num => {
            profitPerTruck[num] = Math.round(profitPerTruck[num] * 100) / 100;
        });

        // Calculate Distance based KPIs (still route based for better precision)
        const totalDistance = completedRoutes.reduce((sum, r) => sum + (r.totalDistance || 0), 0);
        const avgRevenuePerKm = totalDistance > 0 ? totalLoadRevenue / totalDistance : 0;
        const avgProfitPerKm = totalDistance > 0 ? totalLoadProfit / totalDistance : 0;

        res.status(200).json({
            success: true,
            dashboard: {
                totalLoads,
                acceptedLoads,
                inProgressLoads,
                completedLoads,
                pendingLoads,
                rejectedLoads,
                totalIncome: totalLoadRevenue,
                totalRevenue: totalLoadRevenue,
                totalCost: totalLoadCost,
                totalProfit: totalLoadProfit,
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
