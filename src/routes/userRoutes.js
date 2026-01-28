const express = require('express');
const {
    createDriver,
    getDrivers,
    getDriver,
    toggleDriverStatus,
    deleteDriver,
    updateProfile,
} = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Profile update - requires authentication only (any user can update their own profile)
router.patch('/profile', protect, updateProfile);

// All other routes require authentication + manager role
router.use(protect);
router.use(authorize('manager'));

router.route('/')
    .post(createDriver)
    .get(getDrivers);

router.route('/:id')
    .get(getDriver)
    .delete(deleteDriver);

router.route('/:id/status')
    .patch(toggleDriverStatus);

module.exports = router;
