const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');

// Get all installments with customer info
router.get('/', async (req, res) => {
  try {
    const { customer_id } = req.query;
    let query = `
      SELECT i.*, 
        c.name as customer_name,
        c.phone as customer_phone,
        c.status as customer_status,
        (SELECT COUNT(*) FROM payments WHERE installment_id = i.id AND status = 'paid') as paid_count,
        (SELECT COUNT(*) FROM payments WHERE installment_id = i.id AND status = 'pending') as pending_count,
        (SELECT COUNT(*) FROM payments WHERE installment_id = i.id AND status = 'overdue') as overdue_count
      FROM installments i
      JOIN customers c ON i.customer_id = c.id
    `;
    const params = [];

    if (customer_id) {
      query += ' WHERE i.customer_id = ?';
      params.push(customer_id);
    }

    query += ' ORDER BY i.created_at DESC';

    const [rows] = await pool.query(query, params);
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Get installments error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get installment by ID with payments
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const [installments] = await pool.query(`
      SELECT i.*, 
        c.name as customer_name,
        c.phone as customer_phone,
        c.line_user_id
      FROM installments i
      JOIN customers c ON i.customer_id = c.id
      WHERE i.id = ?
    `, [id]);

    if (installments.length === 0) {
      return res.status(404).json({ success: false, error: 'Installment not found' });
    }

    const [payments] = await pool.query(`
      SELECT * FROM payments 
      WHERE installment_id = ?
      ORDER BY month_number ASC
    `, [id]);

    res.json({ 
      success: true, 
      data: { 
        ...installments[0], 
        payments 
      } 
    });
  } catch (error) {
    console.error('Get installment error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create installment with auto-generated payments
router.post('/', async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();

    const { 
      customer_id, 
      product_name, 
      total_amount, 
      monthly_payment, 
      total_months, 
      start_date,
      due_day = 1 
    } = req.body;

    // Validate required fields
    if (!customer_id || !product_name || !total_amount || !monthly_payment || !total_months || !start_date) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: customer_id, product_name, total_amount, monthly_payment, total_months, start_date' 
      });
    }

    // Check if customer exists
    const [customer] = await connection.query('SELECT id FROM customers WHERE id = ?', [customer_id]);
    if (customer.length === 0) {
      return res.status(404).json({ success: false, error: 'Customer not found' });
    }

    // Create installment
    const [installmentResult] = await connection.query(`
      INSERT INTO installments (customer_id, product_name, total_amount, monthly_payment, total_months, start_date, due_day)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [customer_id, product_name, total_amount, monthly_payment, total_months, start_date, due_day]);

    const installmentId = installmentResult.insertId;

    // Generate payments for each month
    const startDateObj = new Date(start_date);
    const payments = [];

    for (let month = 1; month <= total_months; month++) {
      const dueDate = new Date(startDateObj);
      dueDate.setMonth(dueDate.getMonth() + month - 1);
      dueDate.setDate(due_day);

      // Handle month overflow (e.g., Jan 31 + 1 month)
      if (dueDate.getDate() !== due_day) {
        dueDate.setDate(0); // Go to last day of previous month
      }

      payments.push([
        installmentId,
        month,
        dueDate.toISOString().split('T')[0],
        monthly_payment,
        'pending'
      ]);
    }

    // Bulk insert payments
    await connection.query(`
      INSERT INTO payments (installment_id, month_number, due_date, amount, status)
      VALUES ?
    `, [payments]);

    await connection.commit();

    // Fetch created installment with payments
    const [newInstallment] = await pool.query(`
      SELECT * FROM installments WHERE id = ?
    `, [installmentId]);

    const [newPayments] = await pool.query(`
      SELECT * FROM payments WHERE installment_id = ? ORDER BY month_number ASC
    `, [installmentId]);

    res.status(201).json({ 
      success: true, 
      data: { 
        ...newInstallment[0], 
        payments: newPayments 
      } 
    });
  } catch (error) {
    await connection.rollback();
    console.error('Create installment error:', error);
    res.status(500).json({ success: false, error: error.message });
  } finally {
    connection.release();
  }
});

// Update installment
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { product_name, due_day } = req.body;

    const updates = [];
    const params = [];

    if (product_name !== undefined) {
      updates.push('product_name = ?');
      params.push(product_name);
    }
    if (due_day !== undefined) {
      updates.push('due_day = ?');
      params.push(due_day);
    }

    if (updates.length === 0) {
      return res.status(400).json({ success: false, error: 'No fields to update' });
    }

    params.push(id);
    await pool.query(`UPDATE installments SET ${updates.join(', ')} WHERE id = ?`, params);

    const [updated] = await pool.query('SELECT * FROM installments WHERE id = ?', [id]);
    res.json({ success: true, data: updated[0] });
  } catch (error) {
    console.error('Update installment error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete installment (cascade deletes payments)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const [installment] = await pool.query('SELECT * FROM installments WHERE id = ?', [id]);
    if (installment.length === 0) {
      return res.status(404).json({ success: false, error: 'Installment not found' });
    }

    await pool.query('DELETE FROM installments WHERE id = ?', [id]);
    res.json({ success: true, message: 'Installment deleted successfully' });
  } catch (error) {
    console.error('Delete installment error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
