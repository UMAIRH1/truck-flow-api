const Load = require('../models/Load');
const { convertToBase64, validateImageFile } = require('../services/uploadService');
const notificationService = require('../services/notificationService');

// @desc    Create load (manager only)
// @route   POST /api/loads
// @access  Private/Manager
exports.createLoad = async (req, res) => {
    try {
        const { 
            pickupLocation,
            dropoffLocation,
            clientName,
            clientPrice,
            driverPrice,
            shippingType,
            loadWeight,
            pallets,
            loadingDate,
            loadingTime,
            paymentTerms,
            expectedPayoutDate,
            fuel,
            tolls,
            otherExpenses,
            notes,
            driverId
        } = req.body;

        // Validate required fields
        if (!pickupLocation || !dropoffLocation) {
            return res.status(400).json({
                success: false,
                message: 'Pickup and dropoff locations are required',
            });
        }

        if (!clientName) {
            return res.status(400).json({
                success: false,
                message: 'Client name is required',
            });
        }

        if (!clientPrice || !paymentTerms) {
            return res.status(400).json({
                success: false,
                message: 'Client price and payment terms are required',
            });
        }

        if (!loadingDate || !loadingTime) {
            return res.status(400).json({
                success: false,
                message: 'Loading date and time are required',
            });
        }

        // Calculate expected payout date if not provided
        let calculatedPayoutDate = expectedPayoutDate;
        if (!calculatedPayoutDate && loadingDate && paymentTerms) {
            calculatedPayoutDate = new Date(loadingDate);
            calculatedPayoutDate.setDate(calculatedPayoutDate.getDate() + paymentTerms);
        }

        // Create load with all fields matching UI
        const loadData = {
            createdBy: req.user._id,
            pickupLocation,
            dropoffLocation,
            clientName,
            clientPrice,
            driverPrice: driverPrice || 0,
            shippingType: shippingType || 'FTL',
            loadWeight: loadWeight || 0,
            pallets: pallets || undefined,
            loadingDate,
            loadingTime,
            paymentTerms: paymentTerms || 45,
            expectedPayoutDate: calculatedPayoutDate,
            fuel: fuel || 0,
            tolls: tolls || 0,
            otherExpenses: otherExpenses || 0,
            notes: notes || '',
            status: 'pending',
        };

        // Add driver if provided
        if (driverId) {
            loadData.assignedDriver = driverId;
        }

        // Create load
        const load = await Load.create(loadData);

        // Populate driver info if assigned
        const populatedLoad = await Load.findById(load._id)
            .populate('createdBy', 'name email')
            .populate('assignedDriver', 'name email phone');

        // Send notification to driver if assigned
        if (driverId) {
            try {
                await notificationService.notifyDriverLoadAssigned(driverId, populatedLoad);
            } catch (notifError) {
                console.error('Error sending notification:', notifError);
            }
        }

        res.status(201).json({
            success: true,
            message: 'Load created successfully',
            load: populatedLoad,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Get all loads
// @route   GET /api/loads
// @access  Private (Manager: all loads, Driver: assigned loads only)
exports.getLoads = async (req, res) => {
    try {
        let query = {};

        // Driver can only see their assigned loads
        if (req.user.role === 'driver') {
            query.assignedDriver = req.user._id;
        } else if (req.user.role === 'manager') {
            // Manager sees loads they created
            query.createdBy = req.user._id;
        }

        // Optional status filter
        if (req.query.status) {
            query.status = req.query.status;
        }

        const loads = await Load.find(query)
            .populate('createdBy', 'name email')
            .populate('assignedDriver', 'name email phone')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: loads.length,
            loads,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Helper function to find load by ID or loadNumber
const findLoadByIdOrNumber = async (identifier) => {
    // Try to find by MongoDB _id first
    if (identifier.match(/^[0-9a-fA-F]{24}$/)) {
        return await Load.findById(identifier);
    }
    
    // Otherwise, search by matching the last 8 characters of _id (our loadNumber logic)
    const loads = await Load.find({});
    return loads.find(load => {
        const loadNumber = load._id.toString().slice(-8).toUpperCase();
        return loadNumber === identifier.toUpperCase();
    });
};

// @desc    Get single load
// @route   GET /api/loads/:id
// @access  Private
exports.getLoad = async (req, res) => {
    try {
        const load = await findLoadByIdOrNumber(req.params.id);

        if (!load) {
            return res.status(404).json({
                success: false,
                message: 'Load not found',
            });
        }

        // Populate after finding
        await load.populate('createdBy', 'name email');
        await load.populate('assignedDriver', 'name email phone');

        if (!load) {
            return res.status(404).json({
                success: false,
                message: 'Load not found',
            });
        }

        // Driver can only view their assigned loads
        if (req.user.role === 'driver' && 
            (!load.assignedDriver || load.assignedDriver._id.toString() !== req.user._id.toString())) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to view this load',
            });
        }

        res.status(200).json({
            success: true,
            load,
        });
    } catch (err) {
        console.error(err);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({
                success: false,
                message: 'Load not found',
            });
        }
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Update load (manager only)
// @route   PATCH /api/loads/:id
// @access  Private/Manager
exports.updateLoad = async (req, res) => {
    try {
        const load = await findLoadByIdOrNumber(req.params.id);

        if (!load) {
            return res.status(404).json({
                success: false,
                message: 'Load not found',
            });
        }

        // Only allow updating if load is pending or accepted
        if (load.status === 'completed') {
            return res.status(400).json({
                success: false,
                message: 'Cannot update a completed load',
            });
        }

        const {
            pickupLocation,
            dropoffLocation,
            clientName,
            clientPrice,
            driverPrice,
            shippingType,
            loadWeight,
            pallets,
            loadingDate,
            loadingTime,
            paymentTerms,
            expectedPayoutDate,
            fuel,
            tolls,
            otherExpenses,
            notes,
        } = req.body;

        // Update fields if provided
        if (pickupLocation) load.pickupLocation = pickupLocation;
        if (dropoffLocation) load.dropoffLocation = dropoffLocation;
        if (clientName) load.clientName = clientName;
        if (clientPrice !== undefined) load.clientPrice = clientPrice;
        if (driverPrice !== undefined) load.driverPrice = driverPrice;
        if (shippingType) load.shippingType = shippingType;
        if (loadWeight !== undefined) load.loadWeight = loadWeight;
        if (pallets !== undefined) load.pallets = pallets;
        if (loadingDate) load.loadingDate = loadingDate;
        if (loadingTime) load.loadingTime = loadingTime;
        if (paymentTerms !== undefined) load.paymentTerms = paymentTerms;
        if (expectedPayoutDate) load.expectedPayoutDate = expectedPayoutDate;
        if (fuel !== undefined) load.fuel = fuel;
        if (tolls !== undefined) load.tolls = tolls;
        if (otherExpenses !== undefined) load.otherExpenses = otherExpenses;
        if (notes !== undefined) load.notes = notes;

        await load.save();

        const updatedLoad = await Load.findById(load._id)
            .populate('createdBy', 'name email')
            .populate('assignedDriver', 'name email phone');

        res.status(200).json({
            success: true,
            message: 'Load updated successfully',
            load: updatedLoad,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Delete load (manager only)
// @route   DELETE /api/loads/:id
// @access  Private/Manager
exports.deleteLoad = async (req, res) => {
    try {
        const load = await findLoadByIdOrNumber(req.params.id);

        if (!load) {
            return res.status(404).json({
                success: false,
                message: 'Load not found',
            });
        }

        await load.deleteOne();

        res.status(200).json({
            success: true,
            message: 'Load deleted successfully',
        });
    } catch (err) {
        console.error(err);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({
                success: false,
                message: 'Load not found',
            });
        }
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Assign driver to load (manager only)
// @route   PATCH /api/loads/:id/assign
// @access  Private/Manager
exports.assignDriver = async (req, res) => {
    try {
        const driverId = req.body?.driverId;

        if (!driverId) {
            return res.status(400).json({
                success: false,
                message: 'Driver ID is required',
            });
        }

        const load = await findLoadByIdOrNumber(req.params.id);

        if (!load) {
            return res.status(404).json({
                success: false,
                message: 'Load not found',
            });
        }

        // Check if load is already accepted/completed
        if (load.status === 'accepted' || load.status === 'completed') {
            return res.status(400).json({
                success: false,
                message: 'Cannot reassign a load that is already accepted or completed',
            });
        }

        load.assignedDriver = driverId;
        load.status = 'pending';
        await load.save();

        const updatedLoad = await Load.findById(load._id)
            .populate('createdBy', 'name email')
            .populate('assignedDriver', 'name email phone');

        // Send notification to driver
        try {
            await notificationService.notifyDriverLoadAssigned(driverId, updatedLoad);
        } catch (notifError) {
            console.error('Error sending notification:', notifError);
        }

        res.status(200).json({
            success: true,
            message: 'Driver assigned successfully',
            load: updatedLoad,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Accept load (driver only)
// @route   PATCH /api/loads/:id/accept
// @access  Private/Driver
exports.acceptLoad = async (req, res) => {
    try {
        const load = await findLoadByIdOrNumber(req.params.id);

        if (!load) {
            return res.status(404).json({
                success: false,
                message: 'Load not found',
            });
        }

        // Check if load is assigned to this driver
        if (!load.assignedDriver || load.assignedDriver.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'This load is not assigned to you',
            });
        }

        // Check if load is in pending status
        if (load.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: `Cannot accept a load with status '${load.status}'`,
            });
        }

        load.status = 'accepted';
        await load.save();

        // Populate load to get driver name
        await load.populate('createdBy', 'name email');
        await load.populate('assignedDriver', 'name email phone');

        // Send notification to manager
        try {
            await notificationService.notifyManagerLoadAccepted(
                load.createdBy._id,
                load,
                req.user.name
            );
        } catch (notifError) {
            console.error('Error sending notification:', notifError);
        }

        res.status(200).json({
            success: true,
            message: 'Load accepted successfully',
            load,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Decline load (driver only)
// @route   PATCH /api/loads/:id/decline
// @access  Private/Driver
exports.declineLoad = async (req, res) => {
    try {
        const load = await findLoadByIdOrNumber(req.params.id);

        if (!load) {
            return res.status(404).json({
                success: false,
                message: 'Load not found',
            });
        }

        // Check if load is assigned to this driver
        if (!load.assignedDriver || load.assignedDriver.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'This load is not assigned to you',
            });
        }

        // Check if load is in pending status
        if (load.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: `Cannot decline a load with status '${load.status}'`,
            });
        }

        load.status = 'rejected';
        await load.save();

        // Populate load to get manager info
        await load.populate('createdBy', 'name email');
        await load.populate('assignedDriver', 'name email phone');

        // Send notification to manager
        try {
            await notificationService.notifyManagerLoadRejected(
                load.createdBy._id,
                load,
                req.user.name
            );
        } catch (notifError) {
            console.error('Error sending notification:', notifError);
        }

        res.status(200).json({
            success: true,
            message: 'Load declined',
            load,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};


// @desc    Upload POD (Proof of Delivery) image (driver only)
// @route   POST /api/loads/:id/pod
// @access  Private/Driver
exports.uploadPOD = async (req, res) => {
    try {
        const { image } = req.body;

        if (!image) {
            return res.status(400).json({
                success: false,
                message: 'Please provide an image',
            });
        }

        // Validate image URL (Cloudinary or base64)
        const isBase64 = image.startsWith('data:image/');
        const isCloudinaryUrl = image.startsWith('https://res.cloudinary.com/');
        const isHttpUrl = image.startsWith('http://') || image.startsWith('https://');
        
        if (!isBase64 && !isCloudinaryUrl && !isHttpUrl) {
            console.log('Invalid image format received:', image.substring(0, 100));
            return res.status(400).json({
                success: false,
                message: 'Invalid image format. Expected Cloudinary URL or base64 image.',
            });
        }

        const load = await findLoadByIdOrNumber(req.params.id);

        if (!load) {
            return res.status(404).json({
                success: false,
                message: 'Load not found',
            });
        }

        // Check if load is assigned to this driver
        if (!load.assignedDriver || load.assignedDriver.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'This load is not assigned to you',
            });
        }

        // Check if load is accepted
        if (load.status !== 'accepted') {
            return res.status(400).json({
                success: false,
                message: 'Can only upload POD for accepted loads',
            });
        }

        // Update load with POD (Cloudinary URL or base64)
        load.podImage = image;
        load.status = 'completed';
        load.completedAt = new Date();
        await load.save();

        // Populate load to get manager info
        await load.populate('createdBy', 'name email');
        await load.populate('assignedDriver', 'name email phone');

        // Send notification to manager
        try {
            await notificationService.notifyManagerLoadCompleted(
                load.createdBy._id,
                load,
                req.user.name
            );
        } catch (notifError) {
            console.error('Error sending notification:', notifError);
        }

        res.status(200).json({
            success: true,
            message: 'POD uploaded successfully. Load marked as completed.',
            load,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Upload invoice and documents for load
// @route   POST /api/loads/:id/documents
// @access  Private/Driver
exports.uploadDocuments = async (req, res) => {
    try {
        console.log('=== UPLOAD DOCUMENTS API ===');
        console.log('Load ID:', req.params.id);
        console.log('User:', req.user.name, req.user._id);
        console.log('Request body:', JSON.stringify(req.body, null, 2));
        
        const { invoices, documents } = req.body;

        if ((!invoices || invoices.length === 0) && (!documents || documents.length === 0)) {
            console.log('❌ No files provided');
            return res.status(400).json({
                success: false,
                message: 'Please provide at least one invoice or document',
            });
        }

        console.log('Files received:', {
            invoiceCount: invoices?.length || 0,
            documentCount: documents?.length || 0
        });

        const load = await findLoadByIdOrNumber(req.params.id);

        if (!load) {
            console.log('❌ Load not found');
            return res.status(404).json({
                success: false,
                message: 'Load not found',
            });
        }

        console.log('Load found:', {
            id: load._id,
            status: load.status,
            assignedDriver: load.assignedDriver
        });

        // Check if load is assigned to this driver
        if (!load.assignedDriver || load.assignedDriver.toString() !== req.user._id.toString()) {
            console.log('❌ Load not assigned to this driver');
            return res.status(403).json({
                success: false,
                message: 'This load is not assigned to you',
            });
        }

        // Update load with documents
        if (invoices && invoices.length > 0) {
            load.invoices = [...(load.invoices || []), ...invoices];
            console.log('✅ Added invoices:', invoices.length);
        }
        if (documents && documents.length > 0) {
            load.documents = [...(load.documents || []), ...documents];
            console.log('✅ Added documents:', documents.length);
        }

        // Mark load as completed when documents are uploaded
        const oldStatus = load.status;
        load.status = 'completed';
        load.completedAt = new Date();
        console.log('✅ Status changed:', oldStatus, '→', load.status);

        await load.save();
        console.log('✅ Load saved successfully');

        // Populate load to get manager info
        await load.populate('createdBy', 'name email');
        await load.populate('assignedDriver', 'name email phone');

        // Send notification to manager
        try {
            await notificationService.notifyManagerDocumentsUploaded(
                load.createdBy._id,
                load,
                req.user.name
            );
            console.log('✅ Notification sent to manager');
        } catch (notifError) {
            console.error('⚠️ Error sending notification:', notifError);
        }

        console.log('✅ Sending success response');
        res.status(200).json({
            success: true,
            message: 'Documents uploaded successfully',
            load,
        });
    } catch (err) {
        console.error('❌ Server error:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
