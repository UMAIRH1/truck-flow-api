const Notification = require('../models/Notification');
const { getIO, isUserOnline } = require('../config/socket');

/**
 * Create and send notification
 */
const createNotification = async ({ userId, type, title, message, titleKey, messageKey, params = {}, loadId, loadNumber }) => {
  try {
    // Save to database
    const notification = await Notification.create({
      userId,
      type,
      title,
      message,
      titleKey,
      messageKey,
      params,
      loadId,
      loadNumber
    });

    // Send real-time notification if user is online
    if (isUserOnline(userId)) {
      const io = getIO();
      io.to(`user:${userId}`).emit('notification', {
        id: notification._id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        titleKey: notification.titleKey,
        messageKey: notification.messageKey,
        params: notification.params,
        loadId: notification.loadId,
        loadNumber: notification.loadNumber,
        read: notification.read,
        createdAt: notification.createdAt
      });
    }

    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

/**
 * Notify manager about new load
 */
const notifyManagerNewLoad = async (managerId, load) => {
  const loadNum = load._id.toString().slice(-8).toUpperCase();
  return createNotification({
    userId: managerId,
    type: 'load_created',
    title: 'New Load Created',
    message: `Load #${loadNum} from ${load.pickupLocation} to ${load.dropoffLocation} has been created`,
    titleKey: 'notifications.newLoad',
    messageKey: 'notifications.newLoadCreated',
    params: {
      loadNumber: loadNum,
      pickup: load.pickupLocation,
      dropoff: load.dropoffLocation
    },
    loadId: load._id,
    loadNumber: loadNum
  });
};

/**
 * Notify driver about load assignment
 */
const notifyDriverLoadAssigned = async (driverId, load) => {
  const loadNum = load._id.toString().slice(-8).toUpperCase();
  return createNotification({
    userId: driverId,
    type: 'load_assigned',
    title: 'New Load Assigned',
    message: `You have been assigned load #${loadNum} from ${load.pickupLocation} to ${load.dropoffLocation}`,
    titleKey: 'notifications.loadAssigned',
    messageKey: 'notifications.loadAssignedToYou',
    params: {
      loadNumber: loadNum,
      pickup: load.pickupLocation,
      dropoff: load.dropoffLocation
    },
    loadId: load._id,
    loadNumber: loadNum
  });
};

/**
 * Notify manager about load acceptance
 */
const notifyManagerLoadAccepted = async (managerId, load, driverName) => {
  const loadNum = load._id.toString().slice(-8).toUpperCase();
  return createNotification({
    userId: managerId,
    type: 'load_accepted',
    title: 'Load Accepted',
    message: `${driverName} accepted load #${loadNum} (${load.pickupLocation} → ${load.dropoffLocation})`,
    titleKey: 'notifications.loadAccepted',
    messageKey: 'notifications.driverAcceptedLoadDetails',
    params: {
      driverName,
      loadNumber: loadNum,
      pickup: load.pickupLocation,
      dropoff: load.dropoffLocation
    },
    loadId: load._id,
    loadNumber: loadNum
  });
};

/**
 * Notify manager about load rejection
 */
const notifyManagerLoadRejected = async (managerId, load, driverName) => {
  const loadNum = load._id.toString().slice(-8).toUpperCase();
  return createNotification({
    userId: managerId,
    type: 'load_rejected',
    title: 'Load Rejected',
    message: `${driverName} rejected load #${loadNum} (${load.pickupLocation} → ${load.dropoffLocation})`,
    titleKey: 'notifications.loadRejected',
    messageKey: 'notifications.driverRejectedLoadDetails',
    params: {
      driverName,
      loadNumber: loadNum,
      pickup: load.pickupLocation,
      dropoff: load.dropoffLocation
    },
    loadId: load._id,
    loadNumber: loadNum
  });
};

/**
 * Notify manager about load completion
 */
const notifyManagerLoadCompleted = async (managerId, load, driverName) => {
  const loadNum = load._id.toString().slice(-8).toUpperCase();
  return createNotification({
    userId: managerId,
    type: 'load_completed',
    title: 'Load Completed',
    message: `${driverName} completed load #${loadNum} (${load.pickupLocation} → ${load.dropoffLocation})`,
    titleKey: 'notifications.loadCompleted',
    messageKey: 'notifications.driverCompletedLoadDetails',
    params: {
      driverName,
      loadNumber: loadNum,
      pickup: load.pickupLocation,
      dropoff: load.dropoffLocation
    },
    loadId: load._id,
    loadNumber: loadNum
  });
};

/**
 * Get user notifications
 */
const getUserNotifications = async (userId, limit = 50) => {
  return Notification.find({ userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
};

/**
 * Mark notification as read
 */
const markAsRead = async (notificationId, userId) => {
  return Notification.findOneAndUpdate(
    { _id: notificationId, userId },
    { read: true },
    { new: true }
  );
};

/**
 * Mark all notifications as read
 */
const markAllAsRead = async (userId) => {
  return Notification.updateMany(
    { userId, read: false },
    { read: true }
  );
};

/**
 * Get unread count
 */
const getUnreadCount = async (userId) => {
  return Notification.countDocuments({ userId, read: false });
};

/**
 * Notify manager when driver uploads documents
 */
const notifyManagerDocumentsUploaded = async (managerId, load, driverName) => {
  const loadNum = load.loadNumber || load._id.toString().slice(-8).toUpperCase();
  return createNotification({
    userId: managerId,
    type: 'documents_uploaded',
    title: 'Documents Uploaded',
    message: `${driverName} has uploaded documents for load #${loadNum} (${load.pickupLocation} → ${load.dropoffLocation})`,
    titleKey: 'notifications.documentsUploaded',
    messageKey: 'notifications.driverUploadedDocumentsDetails',
    params: {
      driverName,
      loadNumber: loadNum,
      pickup: load.pickupLocation,
      dropoff: load.dropoffLocation
    },
    loadId: load._id,
    loadNumber: loadNum
  });
};

/**
 * Delete notification
 */
const deleteNotification = async (notificationId, userId) => {
  return Notification.findOneAndDelete({ _id: notificationId, userId });
};

module.exports = {
  createNotification,
  notifyManagerNewLoad,
  notifyDriverLoadAssigned,
  notifyManagerLoadAccepted,
  notifyManagerLoadRejected,
  notifyManagerLoadCompleted,
  notifyManagerDocumentsUploaded,
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
  deleteNotification
};
