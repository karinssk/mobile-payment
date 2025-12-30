const { pool } = require('../config/database');
const { sendPushMessage, createPaymentReminderFlex } = require('./lineService');

/**
 * Get all payments due tomorrow (for before_due notification)
 */
const getPaymentsDueTomorrow = async () => {
  const [rows] = await pool.query(`
    SELECT 
      p.id as payment_id,
      p.due_date,
      p.amount,
      p.month_number,
      i.total_months,
      i.product_name,
      c.id as customer_id,
      c.name as customer_name,
      c.line_user_id
    FROM payments p
    JOIN installments i ON p.installment_id = i.id
    JOIN customers c ON i.customer_id = c.id
    WHERE p.due_date = DATE_ADD(CURDATE(), INTERVAL 1 DAY)
    AND p.status = 'pending'
    AND c.line_user_id IS NOT NULL
  `);
  return rows;
};

/**
 * Get all payments due today (for on_due notification)
 */
const getPaymentsDueToday = async () => {
  const [rows] = await pool.query(`
    SELECT 
      p.id as payment_id,
      p.due_date,
      p.amount,
      p.month_number,
      i.total_months,
      i.product_name,
      c.id as customer_id,
      c.name as customer_name,
      c.line_user_id
    FROM payments p
    JOIN installments i ON p.installment_id = i.id
    JOIN customers c ON i.customer_id = c.id
    WHERE p.due_date = CURDATE()
    AND p.status = 'pending'
    AND c.line_user_id IS NOT NULL
  `);
  return rows;
};

/**
 * Get all overdue payments
 */
const getOverduePayments = async () => {
  const [rows] = await pool.query(`
    SELECT 
      p.id as payment_id,
      p.due_date,
      p.amount,
      p.month_number,
      i.total_months,
      i.product_name,
      c.id as customer_id,
      c.name as customer_name,
      c.line_user_id
    FROM payments p
    JOIN installments i ON p.installment_id = i.id
    JOIN customers c ON i.customer_id = c.id
    WHERE p.due_date < CURDATE()
    AND p.status = 'pending'
    AND c.line_user_id IS NOT NULL
  `);
  return rows;
};

/**
 * Log notification attempt
 */
const logNotification = async (paymentId, customerId, type, status, errorMessage = null) => {
  await pool.query(`
    INSERT INTO notification_logs (payment_id, customer_id, notification_type, status, error_message)
    VALUES (?, ?, ?, ?, ?)
  `, [paymentId, customerId, type, status, errorMessage]);
};

/**
 * Check if notification was already sent today
 */
const wasNotificationSentToday = async (paymentId, type) => {
  const [rows] = await pool.query(`
    SELECT id FROM notification_logs
    WHERE payment_id = ?
    AND notification_type = ?
    AND DATE(sent_at) = CURDATE()
    AND status = 'success'
  `, [paymentId, type]);
  return rows.length > 0;
};

/**
 * Send notification to customer
 */
const sendNotification = async (payment, reminderType) => {
  try {
    // Check if already sent today
    const alreadySent = await wasNotificationSentToday(payment.payment_id, reminderType);
    if (alreadySent) {
      console.log(`Notification already sent for payment ${payment.payment_id}`);
      return { skipped: true };
    }

    // Format due date
    const dueDate = new Date(payment.due_date).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    // Create Flex message
    const flexMessage = createPaymentReminderFlex({
      customerName: payment.customer_name,
      productName: payment.product_name,
      amount: payment.amount,
      dueDate: dueDate,
      monthNumber: payment.month_number,
      totalMonths: payment.total_months,
      reminderType: reminderType,
    });

    // Send message
    const result = await sendPushMessage(payment.line_user_id, flexMessage);

    // Log result
    await logNotification(
      payment.payment_id,
      payment.customer_id,
      reminderType,
      result.success ? 'success' : 'failed',
      result.error || null
    );

    return result;
  } catch (error) {
    console.error('Send notification error:', error);
    await logNotification(
      payment.payment_id,
      payment.customer_id,
      reminderType,
      'failed',
      error.message
    );
    return { success: false, error: error.message };
  }
};

/**
 * Run all notification checks
 */
const runNotifications = async () => {
  console.log('🔔 Starting notification check...');
  
  let results = {
    beforeDue: { sent: 0, failed: 0 },
    onDue: { sent: 0, failed: 0 },
    overdue: { sent: 0, failed: 0 },
  };

  try {
    // 1. Send reminders for payments due tomorrow
    const dueTomorrow = await getPaymentsDueTomorrow();
    console.log(`📅 Found ${dueTomorrow.length} payments due tomorrow`);
    for (const payment of dueTomorrow) {
      const result = await sendNotification(payment, 'before_due');
      if (result.success) results.beforeDue.sent++;
      else if (!result.skipped) results.beforeDue.failed++;
    }

    // 2. Send reminders for payments due today
    const dueToday = await getPaymentsDueToday();
    console.log(`📅 Found ${dueToday.length} payments due today`);
    for (const payment of dueToday) {
      const result = await sendNotification(payment, 'on_due');
      if (result.success) results.onDue.sent++;
      else if (!result.skipped) results.onDue.failed++;
    }

    // 3. Mark overdue and send notifications
    const overdue = await getOverduePayments();
    console.log(`⚠️ Found ${overdue.length} overdue payments`);
    for (const payment of overdue) {
      // Update payment status to overdue
      await pool.query('UPDATE payments SET status = ? WHERE id = ?', ['overdue', payment.payment_id]);
      
      // Update customer status
      await pool.query('UPDATE customers SET status = ? WHERE id = ?', ['overdue', payment.customer_id]);
      
      // Send notification
      const result = await sendNotification(payment, 'overdue');
      if (result.success) results.overdue.sent++;
      else if (!result.skipped) results.overdue.failed++;
    }

    console.log('✅ Notification check completed:', results);
    return results;
  } catch (error) {
    console.error('❌ Notification service error:', error);
    throw error;
  }
};

module.exports = {
  getPaymentsDueTomorrow,
  getPaymentsDueToday,
  getOverduePayments,
  sendNotification,
  runNotifications,
};
