const express = require('express');
const { uploadFile } = require('../controllers/uploadController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// File upload - requires authentication
router.post('/', protect, uploadFile);

module.exports = router;
