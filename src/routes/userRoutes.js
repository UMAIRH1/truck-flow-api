const express = require('express');
const {
    createDriver,
    getDrivers,
    getDriver,
    toggleDriverStatus,
} = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication + manager role
router.use(protect);
router.use(authorize('manager'));

router.route('/')
    .post(createDriver)
    .get(getDrivers);

router.route('/:id')
    .get(getDriver);

router.route('/:id/status')
    .patch(toggleDriverStatus);

module.exports = router;
