const cron = require('node-cron');
const { runNotifications } = require('../services/notificationService');

/**
 * Schedule daily notification job
 * Runs every day at 9:00 AM
 */
const scheduleNotificationJob = () => {
  // Run at 9:00 AM every day
  cron.schedule('0 9 * * *', async () => {
    console.log('⏰ Running scheduled notification job at', new Date().toISOString());
    try {
      await runNotifications();
    } catch (error) {
      console.error('❌ Scheduled notification job failed:', error);
    }
  }, {
    scheduled: true,
    timezone: 'Asia/Bangkok'
  });
  
  console.log('📅 Notification cron job scheduled for 9:00 AM daily (Asia/Bangkok)');
};

/**
 * Run notification job manually (for testing)
 */
const runManualNotification = async () => {
  console.log('🔧 Running manual notification job...');
  return await runNotifications();
};

module.exports = {
  scheduleNotificationJob,
  runManualNotification,
};
