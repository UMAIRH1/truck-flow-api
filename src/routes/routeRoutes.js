const express = require('express');
const {
    createRoute,
    getRoutes,
    getRoute,
    updateRoute,
    deleteRoute,
    addLoadsToRoute,
    removeLoadFromRoute,
    acceptRoute,
    rejectRoute,
    startRoute,
    completeRoute,
    startRouteLoad,
    completeRouteLoad,
    uploadDocuments,
} = require('../controllers/routeController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(protect);

// Manager only routes
router.post('/', authorize('manager'), createRoute);
router.patch('/:id', authorize('manager'), updateRoute);
router.delete('/:id', authorize('manager'), deleteRoute);
router.post('/:id/loads', authorize('manager'), addLoadsToRoute);
router.delete('/:id/loads/:loadId', authorize('manager'), removeLoadFromRoute);

// Driver only routes
router.patch('/:id/accept', authorize('driver'), acceptRoute);
router.patch('/:id/reject', authorize('driver'), rejectRoute);
router.patch('/:id/start', authorize('driver'), startRoute);
router.patch('/:id/complete', authorize('driver'), completeRoute);
router.patch('/:id/loads/:loadId/start', authorize('driver'), startRouteLoad);
router.patch('/:id/loads/:loadId/complete', authorize('driver'), completeRouteLoad);
router.post('/:id/documents', authorize('driver'), uploadDocuments);

// Both manager and driver
router.get('/', getRoutes);
router.get('/:id', getRoute);

module.exports = router;
