const Route = require('../models/Route');
const Load = require('../models/Load');
const notificationService = require('../services/notificationService');

// @desc    Create route (manager only)
// @route   POST /api/routes
// @access  Private/Manager
const createRoute = async (req, res) => {
    try {
        const { 
            routeName,
            assignedDriverId,
            assignedTruck,
            startDate,
            endDate,
            fuelConsumption,
            fuelPricePerLiter,
            driverDailyCost,
            truckCostPerKm,
            tolls,
            otherExpenses,
            notes,
            loadIds, // Array of load IDs to attach
        } = req.body;

        // Validate required fields
        if (!routeName || !assignedDriverId || !startDate) {
            return res.status(400).json({
                success: false,
                message: 'Route name, driver, and start date are required',
            });
        }

        // Create route
        const routeData = {
            routeName,
            assignedDriver: assignedDriverId,
            assignedTruck: assignedTruck || {},
            startDate,
            endDate,
            fuelConsumption: fuelConsumption || 30,
            fuelPricePerLiter: fuelPricePerLiter || 0,
            driverDailyCost: driverDailyCost || 0,
            truckCostPerKm: truckCostPerKm || 0,
            tolls: tolls || 0,
            otherExpenses: otherExpenses || 0,
            notes: notes || '',
            createdBy: req.user._id,
            status: 'pending',
            loads: [],
        };

        const route = await Route.create(routeData);

        // If loads provided, attach them to route
        if (loadIds && loadIds.length > 0) {
            await Load.updateMany(
                { _id: { $in: loadIds } },
                { 
                    $set: { 
                        routeId: route._id,
                        assignedDriver: assignedDriverId 
                    } 
                }
            );
            route.loads = loadIds;
            
            // Calculate total distance and revenue from loads
            const loads = await Load.find({ _id: { $in: loadIds } });
            route.totalDistance = loads.reduce((sum, load) => sum + (load.distance || 0), 0);
            route.totalRevenue = loads.reduce((sum, load) => sum + (load.clientPrice || 0), 0);
            
            await route.save();
        }

        // Populate route data
        const populatedRoute = await Route.findById(route._id)
            .populate('createdBy', 'name email')
            .populate('assignedDriver', 'name email phone')
            .populate('loads');

        // Send notification to driver
        try {
            await notificationService.notifyDriverRouteAssigned(assignedDriverId, populatedRoute);
        } catch (notifError) {
            console.error('Error sending notification:', notifError);
        }

        res.status(201).json({
            success: true,
            message: 'Route created successfully',
            route: populatedRoute,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Get all routes
// @route   GET /api/routes
// @access  Private
const getRoutes = async (req, res) => {
    try {
        let query = {};

        // Driver can only see their assigned routes
        if (req.user.role === 'driver') {
            query.assignedDriver = req.user._id;
        } else if (req.user.role === 'manager') {
            // Manager sees routes they created
            query.createdBy = req.user._id;
        }

        // Optional status filter
        if (req.query.status) {
            query.status = req.query.status;
        }

        const routes = await Route.find(query)
            .populate('createdBy', 'name email')
            .populate('assignedDriver', 'name email phone')
            .populate('loads')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: routes.length,
            routes,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Get single route
// @route   GET /api/routes/:id
// @access  Private
const getRoute = async (req, res) => {
    try {
        const route = await Route.findById(req.params.id)
            .populate('createdBy', 'name email')
            .populate('assignedDriver', 'name email phone')
            .populate('loads');

        if (!route) {
            return res.status(404).json({
                success: false,
                message: 'Route not found',
            });
        }

        // Driver can only view their assigned routes
        if (req.user.role === 'driver' && 
            route.assignedDriver._id.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to view this route',
            });
        }

        res.status(200).json({
            success: true,
            route,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Update route (manager only)
// @route   PATCH /api/routes/:id
// @access  Private/Manager
const updateRoute = async (req, res) => {
    try {
        const route = await Route.findById(req.params.id);

        if (!route) {
            return res.status(404).json({
                success: false,
                message: 'Route not found',
            });
        }

        const {
            routeName,
            assignedTruck,
            startDate,
            endDate,
            fuelConsumption,
            fuelPricePerLiter,
            driverDailyCost,
            truckCostPerKm,
            tolls,
            otherExpenses,
            notes,
        } = req.body;

        // Update fields if provided
        if (routeName) route.routeName = routeName;
        if (assignedTruck) route.assignedTruck = assignedTruck;
        if (startDate) route.startDate = startDate;
        if (endDate) route.endDate = endDate;
        if (fuelConsumption !== undefined) route.fuelConsumption = fuelConsumption;
        if (fuelPricePerLiter !== undefined) route.fuelPricePerLiter = fuelPricePerLiter;
        if (driverDailyCost !== undefined) route.driverDailyCost = driverDailyCost;
        if (truckCostPerKm !== undefined) route.truckCostPerKm = truckCostPerKm;
        if (tolls !== undefined) route.tolls = tolls;
        if (otherExpenses !== undefined) route.otherExpenses = otherExpenses;
        if (notes !== undefined) route.notes = notes;

        await route.save();

        const updatedRoute = await Route.findById(route._id)
            .populate('createdBy', 'name email')
            .populate('assignedDriver', 'name email phone')
            .populate('loads');

        res.status(200).json({
            success: true,
            message: 'Route updated successfully',
            route: updatedRoute,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Delete route (manager only)
// @route   DELETE /api/routes/:id
// @access  Private/Manager
const deleteRoute = async (req, res) => {
    try {
        const route = await Route.findById(req.params.id);

        if (!route) {
            return res.status(404).json({
                success: false,
                message: 'Route not found',
            });
        }

        // Remove routeId from all loads
        await Load.updateMany(
            { routeId: route._id },
            { $unset: { routeId: '' } }
        );

        await route.deleteOne();

        res.status(200).json({
            success: true,
            message: 'Route deleted successfully',
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Add loads to route (manager only)
// @route   POST /api/routes/:id/loads
// @access  Private/Manager
const addLoadsToRoute = async (req, res) => {
    try {
        const { loadIds } = req.body;

        if (!loadIds || loadIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Please provide load IDs',
            });
        }

        const route = await Route.findById(req.params.id);

        if (!route) {
            return res.status(404).json({
                success: false,
                message: 'Route not found',
            });
        }

        // Update loads with routeId and driver
        await Load.updateMany(
            { _id: { $in: loadIds } },
            { 
                $set: { 
                    routeId: route._id,
                    assignedDriver: route.assignedDriver 
                } 
            }
        );

        // Add loads to route
        route.loads = [...new Set([...route.loads, ...loadIds])]; // Avoid duplicates

        // Recalculate total distance and revenue
        const loads = await Load.find({ _id: { $in: route.loads } });
        route.totalDistance = loads.reduce((sum, load) => sum + (load.distance || 0), 0);
        route.totalRevenue = loads.reduce((sum, load) => sum + (load.clientPrice || 0), 0);

        await route.save();

        const updatedRoute = await Route.findById(route._id)
            .populate('createdBy', 'name email')
            .populate('assignedDriver', 'name email phone')
            .populate('loads');

        res.status(200).json({
            success: true,
            message: 'Loads added to route successfully',
            route: updatedRoute,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Remove load from route (manager only)
// @route   DELETE /api/routes/:id/loads/:loadId
// @access  Private/Manager
const removeLoadFromRoute = async (req, res) => {
    try {
        const route = await Route.findById(req.params.id);

        if (!route) {
            return res.status(404).json({
                success: false,
                message: 'Route not found',
            });
        }

        // Remove load from route
        route.loads = route.loads.filter(
            loadId => loadId.toString() !== req.params.loadId
        );

        // Remove routeId from load
        await Load.findByIdAndUpdate(req.params.loadId, {
            $unset: { routeId: '' }
        });

        // Recalculate totals
        const loads = await Load.find({ _id: { $in: route.loads } });
        route.totalDistance = loads.reduce((sum, load) => sum + (load.distance || 0), 0);
        route.totalRevenue = loads.reduce((sum, load) => sum + (load.clientPrice || 0), 0);

        await route.save();

        const updatedRoute = await Route.findById(route._id)
            .populate('createdBy', 'name email')
            .populate('assignedDriver', 'name email phone')
            .populate('loads');

        res.status(200).json({
            success: true,
            message: 'Load removed from route successfully',
            route: updatedRoute,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Accept route (driver only)
// @route   PATCH /api/routes/:id/accept
// @access  Private/Driver
const acceptRoute = async (req, res) => {
    try {
        const route = await Route.findById(req.params.id);

        if (!route) {
            return res.status(404).json({
                success: false,
                message: 'Route not found',
            });
        }

        // Check if route is assigned to this driver
        if (route.assignedDriver.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'This route is not assigned to you',
            });
        }

        if (route.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: `Cannot accept a route with status '${route.status}'`,
            });
        }

        route.status = 'accepted';
        await route.save();

        await route.populate('createdBy', 'name email');
        await route.populate('assignedDriver', 'name email phone');
        await route.populate('loads');

        // Send notification to manager
        try {
            await notificationService.notifyManagerRouteAccepted(
                route.createdBy._id,
                route,
                req.user.name
            );
        } catch (notifError) {
            console.error('Error sending notification:', notifError);
        }

        res.status(200).json({
            success: true,
            message: 'Route accepted successfully',
            route,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Reject route (driver only)
// @route   PATCH /api/routes/:id/reject
// @access  Private/Driver
const rejectRoute = async (req, res) => {
    try {
        const route = await Route.findById(req.params.id);

        if (!route) {
            return res.status(404).json({
                success: false,
                message: 'Route not found',
            });
        }

        if (route.assignedDriver.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'This route is not assigned to you',
            });
        }

        if (route.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: `Cannot reject a route with status '${route.status}'`,
            });
        }

        route.status = 'rejected';
        await route.save();

        await route.populate('createdBy', 'name email');
        await route.populate('assignedDriver', 'name email phone');
        await route.populate('loads');

        // Send notification to manager
        try {
            await notificationService.notifyManagerRouteRejected(
                route.createdBy._id,
                route,
                req.user.name
            );
        } catch (notifError) {
            console.error('Error sending notification:', notifError);
        }

        res.status(200).json({
            success: true,
            message: 'Route rejected',
            route,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

module.exports = {
    createRoute,
    getRoutes,
    getRoute,
    updateRoute,
    deleteRoute,
    addLoadsToRoute,
    removeLoadFromRoute,
    acceptRoute,
    rejectRoute,
};
