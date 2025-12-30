const express = require('express');
const router = express.Router();
const line = require('@line/bot-sdk');
const { pool } = require('../config/database');
const { config, sendPushMessage, createPaymentReminderFlex } = require('../services/lineService');
const { runManualNotification } = require('../jobs/notificationCron');

// LINE Webhook - receives events when users interact with LINE OA
router.post('/webhook', line.middleware(config), async (req, res) => {
  try {
    const events = req.body.events;
    
    for (const event of events) {
      console.log('LINE Event:', JSON.stringify(event, null, 2));

      // Handle follow event (when user adds LINE OA as friend)
      if (event.type === 'follow') {
        const userId = event.source.userId;
        console.log(`New follower: ${userId}`);
        
        // Try to get user profile
        try {
          const client = new line.messagingApi.MessagingApiClient({
            channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
          });
          const profile = await client.getProfile(userId);
          console.log('User profile:', profile);
          
          // Store or update customer LINE User ID
          // Note: Customer needs to be linked manually or via phone verification
        } catch (profileError) {
          console.error('Get profile error:', profileError);
        }
      }

      // Handle message event
      if (event.type === 'message' && event.message.type === 'text') {
        const userId = event.source.userId;
        const messageText = event.message.text.toLowerCase().trim();

        // Simple command handling
        if (messageText === 'สถานะ' || messageText === 'status') {
          // Find customer by LINE User ID
          const [customers] = await pool.query(
            'SELECT * FROM customers WHERE line_user_id = ?',
            [userId]
          );

          if (customers.length > 0) {
            const customer = customers[0];
            
            // Get pending payments
            const [payments] = await pool.query(`
              SELECT p.*, i.product_name
              FROM payments p
              JOIN installments i ON p.installment_id = i.id
              WHERE i.customer_id = ? AND p.status IN ('pending', 'overdue')
              ORDER BY p.due_date ASC
              LIMIT 5
            `, [customer.id]);

            let statusText = `สวัสดีคุณ ${customer.name}\n\n`;
            
            if (payments.length === 0) {
              statusText += '✅ ไม่มียอดค้างชำระ';
            } else {
              statusText += '📋 รายการค้างชำระ:\n';
              for (const p of payments) {
                const dueDate = new Date(p.due_date).toLocaleDateString('th-TH');
                const status = p.status === 'overdue' ? '⚠️ เลยกำหนด' : '⏳ รอชำระ';
                statusText += `\n• ${p.product_name}\n  งวดที่ ${p.month_number} | ฿${Number(p.amount).toLocaleString()}\n  ครบกำหนด: ${dueDate} ${status}`;
              }
            }

            await sendPushMessage(userId, { type: 'text', text: statusText });
          } else {
            await sendPushMessage(userId, { 
              type: 'text', 
              text: 'ไม่พบข้อมูลลูกค้า กรุณาติดต่อร้านค้าเพื่อลงทะเบียน' 
            });
          }
        }
      }
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('LINE webhook error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Link LINE User ID to customer (manual linking)
router.post('/link', async (req, res) => {
  try {
    const { customer_id, line_user_id } = req.body;

    if (!customer_id || !line_user_id) {
      return res.status(400).json({ 
        success: false, 
        error: 'customer_id and line_user_id are required' 
      });
    }

    // Check if customer exists
    const [customer] = await pool.query(
      'SELECT * FROM customers WHERE id = ?',
      [customer_id]
    );

    if (customer.length === 0) {
      return res.status(404).json({ success: false, error: 'Customer not found' });
    }

    // Check if LINE User ID is already linked to another customer
    const [existing] = await pool.query(
      'SELECT * FROM customers WHERE line_user_id = ? AND id != ?',
      [line_user_id, customer_id]
    );

    if (existing.length > 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'LINE User ID already linked to another customer' 
      });
    }

    // Link the LINE User ID
    await pool.query(
      'UPDATE customers SET line_user_id = ? WHERE id = ?',
      [line_user_id, customer_id]
    );

    const [updated] = await pool.query('SELECT * FROM customers WHERE id = ?', [customer_id]);
    res.json({ success: true, data: updated[0] });
  } catch (error) {
    console.error('Link LINE error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Send test message
router.post('/test-message', async (req, res) => {
  try {
    const { customer_id, message } = req.body;

    if (!customer_id) {
      return res.status(400).json({ success: false, error: 'customer_id is required' });
    }

    const [customers] = await pool.query(
      'SELECT * FROM customers WHERE id = ?',
      [customer_id]
    );

    if (customers.length === 0) {
      return res.status(404).json({ success: false, error: 'Customer not found' });
    }

    const customer = customers[0];

    if (!customer.line_user_id) {
      return res.status(400).json({ 
        success: false, 
        error: 'Customer does not have LINE User ID linked' 
      });
    }

    const result = await sendPushMessage(customer.line_user_id, {
      type: 'text',
      text: message || 'ทดสอบการส่งข้อความจากระบบ'
    });

    res.json({ success: result.success, error: result.error });
  } catch (error) {
    console.error('Test message error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Manual trigger notifications
router.post('/trigger-notifications', async (req, res) => {
  try {
    const result = await runManualNotification();
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Trigger notifications error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get notification logs
router.get('/notifications', async (req, res) => {
  try {
    const { customer_id, limit = 50 } = req.query;

    let query = `
      SELECT nl.*, 
        c.name as customer_name,
        p.due_date,
        p.amount,
        i.product_name
      FROM notification_logs nl
      JOIN customers c ON nl.customer_id = c.id
      JOIN payments p ON nl.payment_id = p.id
      JOIN installments i ON p.installment_id = i.id
    `;
    const params = [];

    if (customer_id) {
      query += ' WHERE nl.customer_id = ?';
      params.push(customer_id);
    }

    query += ' ORDER BY nl.sent_at DESC LIMIT ?';
    params.push(parseInt(limit));

    const [rows] = await pool.query(query, params);
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
