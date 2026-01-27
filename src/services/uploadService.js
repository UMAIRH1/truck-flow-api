/**
 * Convert image buffer to base64 string
 * @param {Buffer} fileBuffer - Image file buffer from multer
 * @param {String} mimetype - File mimetype (e.g., 'image/jpeg')
 * @returns {String} - Base64 encoded image with data URI prefix
 */
exports.convertToBase64 = (fileBuffer, mimetype) => {
    const base64 = fileBuffer.toString('base64');
    return `data:${mimetype};base64,${base64}`;
};

/**
 * Validate image file
 * @param {Object} file - Multer file object
 * @returns {Boolean} - True if valid
 */
exports.validateImageFile = (file) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!allowedTypes.includes(file.mimetype)) {
        throw new Error('Invalid file type. Only JPEG, PNG, and WebP are allowed.');
    }

    if (file.size > maxSize) {
        throw new Error('File size too large. Maximum size is 5MB.');
    }

    return true;
};
