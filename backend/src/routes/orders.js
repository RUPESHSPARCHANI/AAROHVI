import express from 'express';
import { db } from '../../../database/db.js';
import { requireManagerAuth } from '../middleware/auth.js';

const router = express.Router();

// GET all orders (Protected with Manager Auth)
router.get('/', requireManagerAuth, (req, res) => {
  try {
    const { status } = req.query;
    const orders = db.getOrders(status);
    res.json({ success: true, count: orders.length, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET single order by ID or order_number (Public for customer order tracking)
router.get('/:id', (req, res) => {
  try {
    const order = db.getOrderById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    res.json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST checkout create new order (Public for customer checkout)
router.post('/', (req, res) => {
  try {
    const { customer_name, customer_email, customer_phone, shipping_address, city, state, pincode, items } = req.body;
    
    if (!customer_name || !customer_email || !customer_phone || !shipping_address || !items || items.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide all required shipping and contact details along with at least one item.' 
      });
    }

    const order = db.createOrder(req.body);
    res.status(201).json({
      success: true,
      message: 'Order placed successfully! A confirmation has been generated.',
      data: order
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT update order status & tracking (Protected with Manager Auth)
router.put('/:id/status', requireManagerAuth, (req, res) => {
  try {
    const { order_status, tracking_number } = req.body;
    const updatedOrder = db.updateOrderStatus(req.params.id, { order_status, tracking_number });
    if (!updatedOrder) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    res.json({
      success: true,
      message: `Order ${updatedOrder.order_number} status updated to ${updatedOrder.order_status}`,
      data: updatedOrder
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
