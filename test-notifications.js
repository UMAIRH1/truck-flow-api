const dotenv = require('dotenv');
const mongoose = require('mongoose');

// Load env vars
dotenv.config();

// Connect to database
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB Connected');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  }
};

const testNotifications = async () => {
  await connectDB();

  const Notification = require('./src/models/Notification');
  const User = require('./src/models/User');

  // Find manager
  const manager = await User.findOne({ email: 'manager@truckflow.com' });
  if (!manager) {
    console.log('❌ Manager not found');
    process.exit(1);
  }

  console.log('✅ Manager found:', manager.name);

  // Create test notification
  const notification = await Notification.create({
    userId: manager._id,
    type: 'load_accepted',
    title: 'Test Notification',
    message: 'This is a test notification to verify the system is working',
    loadNumber: 'TEST1234'
  });

  console.log('✅ Test notification created:', notification);

  // Fetch notifications
  const notifications = await Notification.find({ userId: manager._id })
    .sort({ createdAt: -1 })
    .limit(5);

  console.log(`✅ Found ${notifications.length} notifications for manager`);
  notifications.forEach(n => {
    console.log(`  - ${n.title} (${n.type}) - ${n.read ? 'Read' : 'Unread'}`);
  });

  // Get unread count
  const unreadCount = await Notification.countDocuments({ 
    userId: manager._id, 
    read: false 
  });
  console.log(`✅ Unread count: ${unreadCount}`);

  console.log('\n✅ All tests passed! Notification system is working.');
  process.exit(0);
};

testNotifications().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
