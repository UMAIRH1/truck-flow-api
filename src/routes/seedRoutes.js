const express = require('express');
const { seedManager } = require('../controllers/seedController');

const router = express.Router();

// Public route - no authentication required
// This is temporary for easy deployment
router.get('/', seedManager);

module.exports = router;
