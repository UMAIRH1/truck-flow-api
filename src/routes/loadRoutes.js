const express = require('express');
const {
    createLoad,
    getLoads,
    getLoad,
    updateLoad,
    deleteLoad,
    assignDriver,
    acceptLoad,
    declineLoad,
    uploadPOD,
    uploadDocuments,
    startLoad,
    calculateDistance,
    calculateCosts,
} = require('../controllers/loadController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(protect);

// Manager only routes
router.post('/', authorize('manager'), createLoad);
router.patch('/:id', authorize('manager'), updateLoad);
router.delete('/:id', authorize('manager'), deleteLoad);
router.patch('/:id/assign', authorize('manager'), assignDriver);

// Driver only routes
router.patch('/:id/accept', authorize('driver'), acceptLoad);
router.patch('/:id/decline', authorize('driver'), declineLoad);
router.patch('/:id/start', authorize('driver'), startLoad);
router.post('/:id/pod', authorize('driver'), uploadPOD);
router.post('/:id/documents', authorize('driver'), uploadDocuments);

// Both manager and driver (with role-based filtering in controller)
router.get('/', getLoads);
router.get('/:id', getLoad);

// Calculate distance and costs (manager only)
router.post('/calculate-distance', authorize('manager'), calculateDistance);
router.post('/calculate-costs', authorize('manager'), calculateCosts);

module.exports = router;
