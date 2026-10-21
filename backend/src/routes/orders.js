import express from 'express';
import { db } from '../../../database/db.js';
import { requireManagerAuth } from '../middleware/auth.js';
import { requireCustomerAuth } from '../middleware/customerAuth.js';
import { sendOrderConfirmationEmail } from '../services/emailService.js';

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

/**
 * POST /api/orders
 * Create new order - Protected: Requires authenticated customer
 * Enforces server-side authentication, prices, stock, and customer association
 */
router.post('/', requireCustomerAuth, async (req, res) => {
  try {
    const { 
      customer_name, 
      customer_phone, 
      shipping_address, 
      city, 
      state, 
      pincode, 
      delivery_instructions,
      payment_method,
      items 
    } = req.body;
    
    if (!customer_name || !customer_phone || !shipping_address || !pincode || !items || items.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please complete all required delivery details (name, phone, address, pincode) and include items.' 
      });
    }

    // Authenticated customer identity strictly bound to order
    const customer = req.customer;

    const orderPayload = {
      ...req.body,
      customer_id: customer.id,
      customer_name: customer_name.trim(),
      customer_email: customer.email, // Verified email from authenticated session
      customer_phone: customer_phone.trim(),
      shipping_address: shipping_address.trim(),
      city: (city || customer.city || 'Bengaluru').trim(),
      state: (state || customer.state || 'Karnataka').trim(),
      pincode: pincode.trim(),
      delivery_instructions: delivery_instructions ? delivery_instructions.trim() : '',
      payment_method: payment_method || 'Cash on Delivery (COD)'
    };

    const order = db.createOrder(orderPayload);

    // If Cash on Delivery, send automatic confirmation email immediately
    if (order.payment_method === 'Cash on Delivery (COD)') {
      sendOrderConfirmationEmail(order).catch(err => 
        console.error('COD confirmation email error:', err)
      );
    }

    res.status(201).json({
      success: true,
      message: 'Order placed successfully! A confirmation has been generated.',
      data: order
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

/**
 * PUT /api/orders/:id/status
 * Update order status, fulfillment, courier & tracking (Protected with Manager Auth)
 */
router.put('/:id/status', requireManagerAuth, (req, res) => {
  try {
    const { 
      order_status, 
      payment_status, 
      courier_name, 
      tracking_number, 
      tracking_url, 
      estimated_delivery, 
      shipping_fee, 
      notes 
    } = req.body;

    const updatedOrder = db.updateOrderStatus(req.params.id, {
      order_status,
      payment_status,
      courier_name,
      tracking_number,
      tracking_url,
      estimated_delivery,
      shipping_fee,
      notes
    });

    if (!updatedOrder) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    res.json({
      success: true,
      message: `Order #${updatedOrder.order_number} status updated to ${updatedOrder.order_status}`,
      data: updatedOrder
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
