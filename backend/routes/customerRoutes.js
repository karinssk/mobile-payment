const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');

// Get all customers with optional filters
router.get('/', async (req, res) => {
  try {
    const { status, search } = req.query;
    let query = 'SELECT * FROM customers WHERE 1=1';
    const params = [];

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    if (search) {
      query += ' AND (name LIKE ? OR phone LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY created_at DESC';

    const [rows] = await pool.query(query, params);
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Get customers error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get customer by ID with installments
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const [customers] = await pool.query('SELECT * FROM customers WHERE id = ?', [id]);
    if (customers.length === 0) {
      return res.status(404).json({ success: false, error: 'Customer not found' });
    }

    const [installments] = await pool.query(`
      SELECT i.*, 
        (SELECT COUNT(*) FROM payments WHERE installment_id = i.id AND status = 'paid') as paid_count,
        (SELECT COUNT(*) FROM payments WHERE installment_id = i.id AND status = 'pending') as pending_count,
        (SELECT COUNT(*) FROM payments WHERE installment_id = i.id AND status = 'overdue') as overdue_count
      FROM installments i 
      WHERE i.customer_id = ?
      ORDER BY i.created_at DESC
    `, [id]);

    res.json({ 
      success: true, 
      data: { 
        ...customers[0], 
        installments 
      } 
    });
  } catch (error) {
    console.error('Get customer error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create customer
router.post('/', async (req, res) => {
  try {
    const { name, phone, line_user_id } = req.body;

    if (!name || !phone) {
      return res.status(400).json({ success: false, error: 'Name and phone are required' });
    }

    const [result] = await pool.query(
      'INSERT INTO customers (name, phone, line_user_id) VALUES (?, ?, ?)',
      [name, phone, line_user_id || null]
    );

    const [newCustomer] = await pool.query('SELECT * FROM customers WHERE id = ?', [result.insertId]);
    res.status(201).json({ success: true, data: newCustomer[0] });
  } catch (error) {
    console.error('Create customer error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update customer
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, line_user_id, status } = req.body;

    const updates = [];
    const params = [];

    if (name !== undefined) {
      updates.push('name = ?');
      params.push(name);
    }
    if (phone !== undefined) {
      updates.push('phone = ?');
      params.push(phone);
    }
    if (line_user_id !== undefined) {
      updates.push('line_user_id = ?');
      params.push(line_user_id);
    }
    if (status !== undefined) {
      updates.push('status = ?');
      params.push(status);
    }

    if (updates.length === 0) {
      return res.status(400).json({ success: false, error: 'No fields to update' });
    }

    params.push(id);
    await pool.query(`UPDATE customers SET ${updates.join(', ')} WHERE id = ?`, params);

    const [updated] = await pool.query('SELECT * FROM customers WHERE id = ?', [id]);
    res.json({ success: true, data: updated[0] });
  } catch (error) {
    console.error('Update customer error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update customer status
router.put('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['normal', 'paid', 'overdue'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid status' });
    }

    await pool.query('UPDATE customers SET status = ? WHERE id = ?', [status, id]);

    const [updated] = await pool.query('SELECT * FROM customers WHERE id = ?', [id]);
    res.json({ success: true, data: updated[0] });
  } catch (error) {
    console.error('Update customer status error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete customer
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const [customer] = await pool.query('SELECT * FROM customers WHERE id = ?', [id]);
    if (customer.length === 0) {
      return res.status(404).json({ success: false, error: 'Customer not found' });
    }

    await pool.query('DELETE FROM customers WHERE id = ?', [id]);
    res.json({ success: true, message: 'Customer deleted successfully' });
  } catch (error) {
    console.error('Delete customer error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
