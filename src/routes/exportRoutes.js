const express = require('express');
const { exportLoads } = require('../controllers/exportController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication + manager role
router.use(protect);
router.use(authorize('manager'));

router.get('/loads', exportLoads);

module.exports = router;
