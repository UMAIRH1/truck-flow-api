const Notification = require('../models/Notification');
const { getIO, isUserOnline } = require('../config/socket');

/**
 * Create and send notification
 */
const createNotification = async ({ userId, type, title, message, loadId, loadNumber }) => {
  try {
    // Save to database
    const notification = await Notification.create({
      userId,
      type,
      title,
      message,
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
  return createNotification({
    userId: managerId,
    type: 'load_created',
    title: 'New Load Created',
    message: `Load #${load._id.toString().slice(-8).toUpperCase()} from ${load.pickupLocation} to ${load.dropoffLocation} has been created`,
    loadId: load._id,
    loadNumber: load._id.toString().slice(-8).toUpperCase()
  });
};

/**
 * Notify driver about load assignment
 */
const notifyDriverLoadAssigned = async (driverId, load) => {
  return createNotification({
    userId: driverId,
    type: 'load_assigned',
    title: 'New Load Assigned',
    message: `You have been assigned load #${load._id.toString().slice(-8).toUpperCase()} from ${load.pickupLocation} to ${load.dropoffLocation}`,
    loadId: load._id,
    loadNumber: load._id.toString().slice(-8).toUpperCase()
  });
};

/**
 * Notify manager about load acceptance
 */
const notifyManagerLoadAccepted = async (managerId, load, driverName) => {
  return createNotification({
    userId: managerId,
    type: 'load_accepted',
    title: 'Load Accepted',
    message: `${driverName} accepted load #${load._id.toString().slice(-8).toUpperCase()}`,
    loadId: load._id,
    loadNumber: load._id.toString().slice(-8).toUpperCase()
  });
};

/**
 * Notify manager about load rejection
 */
const notifyManagerLoadRejected = async (managerId, load, driverName) => {
  return createNotification({
    userId: managerId,
    type: 'load_rejected',
    title: 'Load Rejected',
    message: `${driverName} rejected load #${load._id.toString().slice(-8).toUpperCase()}`,
    loadId: load._id,
    loadNumber: load._id.toString().slice(-8).toUpperCase()
  });
};

/**
 * Notify manager about load completion
 */
const notifyManagerLoadCompleted = async (managerId, load, driverName) => {
  return createNotification({
    userId: managerId,
    type: 'load_completed',
    title: 'Load Completed',
    message: `${driverName} completed load #${load._id.toString().slice(-8).toUpperCase()}`,
    loadId: load._id,
    loadNumber: load._id.toString().slice(-8).toUpperCase()
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
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
  deleteNotification
};
