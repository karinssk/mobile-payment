const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { createPromptPayQR, getCharge } = require('../services/omiseService');
const { sendPushMessage, createQRCodeMessage } = require('../services/lineService');

// Get all payments with filters
router.get('/', async (req, res) => {
  try {
    const { status, customer_id, installment_id, from_date, to_date } = req.query;
    
    let query = `
      SELECT p.*, 
        i.product_name,
        i.total_months,
        c.id as customer_id,
        c.name as customer_name,
        c.phone as customer_phone,
        c.line_user_id
      FROM payments p
      JOIN installments i ON p.installment_id = i.id
      JOIN customers c ON i.customer_id = c.id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      query += ' AND p.status = ?';
      params.push(status);
    }

    if (customer_id) {
      query += ' AND c.id = ?';
      params.push(customer_id);
    }

    if (installment_id) {
      query += ' AND p.installment_id = ?';
      params.push(installment_id);
    }

    if (from_date) {
      query += ' AND p.due_date >= ?';
      params.push(from_date);
    }

    if (to_date) {
      query += ' AND p.due_date <= ?';
      params.push(to_date);
    }

    query += ' ORDER BY p.due_date ASC';

    const [rows] = await pool.query(query, params);
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Get payments error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get payment by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const [payments] = await pool.query(`
      SELECT p.*, 
        i.product_name,
        i.total_months,
        c.id as customer_id,
        c.name as customer_name,
        c.phone as customer_phone,
        c.line_user_id
      FROM payments p
      JOIN installments i ON p.installment_id = i.id
      JOIN customers c ON i.customer_id = c.id
      WHERE p.id = ?
    `, [id]);

    if (payments.length === 0) {
      return res.status(404).json({ success: false, error: 'Payment not found' });
    }

    res.json({ success: true, data: payments[0] });
  } catch (error) {
    console.error('Get payment error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update payment status
router.put('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['pending', 'paid', 'overdue'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid status' });
    }

    const updates = { status };
    
    if (status === 'paid') {
      updates.paid_at = new Date();
    }

    await pool.query(
      'UPDATE payments SET status = ?, paid_at = ? WHERE id = ?', 
      [status, status === 'paid' ? new Date() : null, id]
    );

    // Check if all payments are paid - update customer status
    const [payment] = await pool.query(`
      SELECT i.customer_id, i.id as installment_id
      FROM payments p
      JOIN installments i ON p.installment_id = i.id
      WHERE p.id = ?
    `, [id]);

    if (payment.length > 0) {
      const [pendingPayments] = await pool.query(`
        SELECT COUNT(*) as count FROM payments 
        WHERE installment_id IN (SELECT id FROM installments WHERE customer_id = ?)
        AND status != 'paid'
      `, [payment[0].customer_id]);

      if (pendingPayments[0].count === 0) {
        await pool.query('UPDATE customers SET status = ? WHERE id = ?', ['paid', payment[0].customer_id]);
      } else if (status === 'paid') {
        // Check if there are overdue payments
        const [overduePayments] = await pool.query(`
          SELECT COUNT(*) as count FROM payments 
          WHERE installment_id IN (SELECT id FROM installments WHERE customer_id = ?)
          AND status = 'overdue'
        `, [payment[0].customer_id]);
        
        if (overduePayments[0].count === 0) {
          await pool.query('UPDATE customers SET status = ? WHERE id = ?', ['normal', payment[0].customer_id]);
        }
      }
    }

    const [updated] = await pool.query(`
      SELECT p.*, 
        i.product_name,
        c.name as customer_name
      FROM payments p
      JOIN installments i ON p.installment_id = i.id
      JOIN customers c ON i.customer_id = c.id
      WHERE p.id = ?
    `, [id]);

    res.json({ success: true, data: updated[0] });
  } catch (error) {
    console.error('Update payment status error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Generate QR Code for payment
router.post('/:id/qrcode', async (req, res) => {
  try {
    const { id } = req.params;
    const { send_to_line = false } = req.body;

    const [payments] = await pool.query(`
      SELECT p.*, 
        i.product_name,
        c.name as customer_name,
        c.line_user_id
      FROM payments p
      JOIN installments i ON p.installment_id = i.id
      JOIN customers c ON i.customer_id = c.id
      WHERE p.id = ?
    `, [id]);

    if (payments.length === 0) {
      return res.status(404).json({ success: false, error: 'Payment not found' });
    }

    const payment = payments[0];

    if (payment.status === 'paid') {
      return res.status(400).json({ success: false, error: 'Payment already paid' });
    }

    // Create PromptPay QR via Omise
    const description = `${payment.product_name} งวดที่ ${payment.month_number}`;
    const result = await createPromptPayQR(parseFloat(payment.amount), description);

    if (!result.success) {
      return res.status(500).json({ success: false, error: result.error });
    }

    // Save charge info
    await pool.query(
      'UPDATE payments SET omise_charge_id = ?, qr_code_data = ? WHERE id = ?',
      [result.chargeId, result.qrCodeUrl, id]
    );

    // Optionally send to LINE
    if (send_to_line && payment.line_user_id) {
      const qrMessage = createQRCodeMessage({
        productName: payment.product_name,
        amount: payment.amount,
        qrCodeUrl: result.qrCodeUrl,
      });
      await sendPushMessage(payment.line_user_id, qrMessage);
    }

    res.json({ 
      success: true, 
      data: {
        qrCodeUrl: result.qrCodeUrl,
        chargeId: result.chargeId,
        expiresAt: result.expiresAt,
      }
    });
  } catch (error) {
    console.error('Generate QR code error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Check payment status from Omise
router.get('/:id/check-payment', async (req, res) => {
  try {
    const { id } = req.params;

    const [payments] = await pool.query(
      'SELECT omise_charge_id, status FROM payments WHERE id = ?', 
      [id]
    );

    if (payments.length === 0) {
      return res.status(404).json({ success: false, error: 'Payment not found' });
    }

    const payment = payments[0];

    if (!payment.omise_charge_id) {
      return res.status(400).json({ success: false, error: 'No QR code generated for this payment' });
    }

    // Get charge status from Omise
    const chargeResult = await getCharge(payment.omise_charge_id);

    if (!chargeResult.success) {
      return res.status(500).json({ success: false, error: chargeResult.error });
    }

    const charge = chargeResult.charge;

    // If charge is successful, mark payment as paid
    if (charge.status === 'successful' && payment.status !== 'paid') {
      await pool.query(
        'UPDATE payments SET status = ?, paid_at = NOW() WHERE id = ?',
        ['paid', id]
      );
    }

    res.json({ 
      success: true, 
      data: {
        omiseStatus: charge.status,
        paid: charge.status === 'successful',
        paymentStatus: charge.status === 'successful' ? 'paid' : payment.status,
      }
    });
  } catch (error) {
    console.error('Check payment error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get dashboard summary
router.get('/summary/dashboard', async (req, res) => {
  try {
    const [summary] = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM customers) as total_customers,
        (SELECT COUNT(*) FROM customers WHERE status = 'normal') as normal_customers,
        (SELECT COUNT(*) FROM customers WHERE status = 'paid') as paid_customers,
        (SELECT COUNT(*) FROM customers WHERE status = 'overdue') as overdue_customers,
        (SELECT COUNT(*) FROM payments WHERE status = 'pending') as pending_payments,
        (SELECT COUNT(*) FROM payments WHERE status = 'paid') as paid_payments,
        (SELECT COUNT(*) FROM payments WHERE status = 'overdue') as overdue_payments,
        (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE status = 'paid') as total_collected,
        (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE status IN ('pending', 'overdue')) as total_outstanding
    `);

    res.json({ success: true, data: summary[0] });
  } catch (error) {
    console.error('Get dashboard summary error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
