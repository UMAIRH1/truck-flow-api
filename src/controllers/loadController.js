const Load = require('../models/Load');
const { uploadToCloudinary } = require('../services/uploadService');

// @desc    Create load (manager only)
// @route   POST /api/loads
// @access  Private/Manager
exports.createLoad = async (req, res) => {
    try {
        const { origin, destination, loadAmount, paymentTerms } = req.body;

        // Validate required fields
        if (!origin?.city || !origin?.postalCode || !destination?.city || !destination?.postalCode) {
            return res.status(400).json({
                success: false,
                message: 'Origin and destination with city and postalCode are required',
            });
        }

        if (!loadAmount || !paymentTerms) {
            return res.status(400).json({
                success: false,
                message: 'Load amount and payment terms are required',
            });
        }

        // Generate load number
        const count = await Load.countDocuments();
        const loadNumber = `LOAD-${String(count + 1001).padStart(4, '0')}`;

        // Calculate expected payout date
        const expectedPayoutDate = new Date(
            Date.now() + paymentTerms * 24 * 60 * 60 * 1000
        );

        // Create load
        const load = await Load.create({
            loadNumber,
            managerId: req.user._id,
            origin,
            destination,
            loadAmount,
            paymentTerms,
            expectedPayoutDate,
        });

        res.status(201).json({
            success: true,
            message: 'Load created successfully',
            load,
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
            query.driverId = req.user._id;
        }

        // Optional status filter
        if (req.query.status) {
            query.status = req.query.status;
        }

        const loads = await Load.find(query)
            .populate('managerId', 'name email')
            .populate('driverId', 'name email phone')
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

// @desc    Get single load
// @route   GET /api/loads/:id
// @access  Private
exports.getLoad = async (req, res) => {
    try {
        const load = await Load.findById(req.params.id)
            .populate('managerId', 'name email')
            .populate('driverId', 'name email phone');

        if (!load) {
            return res.status(404).json({
                success: false,
                message: 'Load not found',
            });
        }

        // Driver can only view their assigned loads
        if (req.user.role === 'driver' && 
            (!load.driverId || load.driverId._id.toString() !== req.user._id.toString())) {
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

// @desc    Delete load (manager only)
// @route   DELETE /api/loads/:id
// @access  Private/Manager
exports.deleteLoad = async (req, res) => {
    try {
        const load = await Load.findById(req.params.id);

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

        const load = await Load.findById(req.params.id);

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

        load.driverId = driverId;
        load.status = 'pending';
        await load.save();

        const updatedLoad = await Load.findById(load._id)
            .populate('managerId', 'name email')
            .populate('driverId', 'name email phone');

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
        const load = await Load.findById(req.params.id);

        if (!load) {
            return res.status(404).json({
                success: false,
                message: 'Load not found',
            });
        }

        // Check if load is assigned to this driver
        if (!load.driverId || load.driverId.toString() !== req.user._id.toString()) {
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
        const load = await Load.findById(req.params.id);

        if (!load) {
            return res.status(404).json({
                success: false,
                message: 'Load not found',
            });
        }

        // Check if load is assigned to this driver
        if (!load.driverId || load.driverId.toString() !== req.user._id.toString()) {
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

        load.status = 'declined';
        await load.save();

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
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Please upload an image file',
            });
        }

        const load = await Load.findById(req.params.id);

        if (!load) {
            return res.status(404).json({
                success: false,
                message: 'Load not found',
            });
        }

        // Check if load is assigned to this driver
        if (!load.driverId || load.driverId.toString() !== req.user._id.toString()) {
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

        // Upload to Cloudinary
        const result = await uploadToCloudinary(req.file.buffer);

        // Update load with POD
        load.pod = {
            imageUrl: result.secure_url,
            uploadedAt: new Date(),
        };
        load.status = 'completed';
        await load.save();

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
