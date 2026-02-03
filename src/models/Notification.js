const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['load_created', 'load_assigned', 'load_accepted', 'load_rejected', 'load_completed', 'load_cancelled', 'documents_uploaded'],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  // Translation keys for multi-language support
  titleKey: {
    type: String
  },
  messageKey: {
    type: String
  },
  // Parameters for translation interpolation
  params: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  loadId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Load'
  },
  loadNumber: {
    type: String
  },
  read: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for efficient queries
notificationSchema.index({ userId: 1, read: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
