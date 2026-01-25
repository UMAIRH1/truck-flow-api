const express = require('express');
const {
    getManagerDashboard,
    getDriverDashboard,
} = require('../controllers/dashboardController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(protect);

router.get('/manager', authorize('manager'), getManagerDashboard);
router.get('/driver', authorize('driver'), getDriverDashboard);

module.exports = router;
