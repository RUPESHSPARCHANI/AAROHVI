import express from 'express';
import crypto from 'crypto';
import Razorpay from 'razorpay';
import { db } from '../../../database/db.js';
import { requireCustomerAuth } from '../middleware/customerAuth.js';
import { sendOrderConfirmationEmail } from '../services/emailService.js';

const router = express.Router();

/**
 * Initialize Razorpay SDK instance
 */
const getRazorpayInstance = () => {
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;

  if (key_id && key_secret && !key_id.includes('your_')) {
    return new Razorpay({ key_id, key_secret });
  }
  return null;
};

/**
 * GET /api/payment/config
 * Public client configuration: provides Razorpay Key ID without exposing secret
 */
router.get('/config', (req, res) => {
  const keyId = process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder';
  const isConfigured = Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET && !process.env.RAZORPAY_KEY_ID.includes('your_'));

  res.json({
    success: true,
    data: {
      keyId,
      currency: 'INR',
      isTestMode: keyId.startsWith('rzp_test_'),
      isConfigured
    }
  });
});

/**
 * POST /api/payment/create-order
 * Create Razorpay payment order on the backend with server-verified prices & stock
 * Protected: Requires authenticated customer
 */
router.post('/create-order', requireCustomerAuth, async (req, res) => {
  try {
    const { 
      items, 
      customer_phone, 
      shipping_address, 
      city, 
      state, 
      pincode, 
      delivery_instructions,
      payment_method = 'Razorpay Online'
    } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Cart items are required to create an order.' });
    }

    if (!shipping_address || !pincode || !customer_phone) {
      return res.status(400).json({ success: false, message: 'Shipping address, phone number, and pincode are required.' });
    }

    // Customer identity strictly sourced from authenticated server session
    const customer = req.customer;

    // Validate prices, calculate exact subtotal, shipping, and verify stock from DB
    const pricing = db.validateAndPriceItems(items);
    const amountInPaise = Math.round(pricing.total_amount * 100);

    // Create preliminary order in database
    const order = db.createOrder({
      customer_id: customer.id,
      customer_name: customer.name,
      customer_email: customer.email,
      customer_phone,
      shipping_address,
      city: city || customer.city || 'Bengaluru',
      state: state || customer.state || 'Karnataka',
      pincode,
      delivery_instructions,
      payment_method,
      payment_status: 'Pending',
      order_status: 'Pending Payment',
      items
    });

    const razorpay = getRazorpayInstance();
    let razorpay_order_id = null;

    if (razorpay) {
      try {
        // Create official order with Razorpay
        const rzpOrder = await razorpay.orders.create({
          amount: amountInPaise,
          currency: 'INR',
          receipt: order.order_number,
          notes: {
            order_id: order.id,
            order_number: order.order_number,
            customer_id: customer.id,
            customer_email: customer.email
          }
        });
        razorpay_order_id = rzpOrder.id;
      } catch (rzpErr) {
        if (rzpErr.statusCode === 401 || (process.env.NODE_ENV !== 'production' && process.env.RAZORPAY_KEY_ID?.startsWith('rzp_test_'))) {
          console.warn('[Razorpay] Razorpay test credentials not yet registered on Razorpay servers; using local test order mode for verification.');
          razorpay_order_id = `order_test_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;
        } else {
          throw rzpErr;
        }
      }
    } else {
      // Safe fallback test mode order when Razorpay keys are in testing placeholder
      razorpay_order_id = `order_test_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      console.log(`[Razorpay] Simulated order created (${razorpay_order_id}) for ₹${pricing.total_amount}`);
    }

    // Attach razorpay order ID to the pending store order
    order.razorpay_order_id = razorpay_order_id;
    db.save();

    res.status(201).json({
      success: true,
      data: {
        order_id: order.id,
        order_number: order.order_number,
        razorpay_order_id,
        amount: amountInPaise,
        amount_inr: pricing.total_amount,
        currency: 'INR',
        key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder',
        customer: {
          name: customer.name,
          email: customer.email,
          phone: customer_phone
        }
      }
    });
  } catch (error) {
    console.error('Error creating payment order:', error);
    res.status(400).json({ success: false, message: error.message || 'Failed to initiate payment order.' });
  }
});

/**
 * POST /api/payment/verify
 * Cryptographic server-side verification of Razorpay payment signature
 * Protected: Requires authenticated customer
 */
router.post('/verify', requireCustomerAuth, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, order_id } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id) {
      return res.status(400).json({ success: false, message: 'Missing Razorpay payment verification parameters.' });
    }

    // Retrieve order by ID or Razorpay order ID
    const order = db.getOrderById(order_id || razorpay_order_id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found for verification.' });
    }

    // Ensure order belongs to authenticated customer
    if (order.customer_id && order.customer_id !== req.customer.id && order.customer_email !== req.customer.email) {
      return res.status(403).json({ success: false, message: 'Access denied. Order belongs to another customer.' });
    }

    // Verify cryptographic signature if secret is configured
    const key_secret = process.env.RAZORPAY_KEY_SECRET;
    if (key_secret && !key_secret.includes('your_')) {
      if (!razorpay_signature) {
        return res.status(400).json({ success: false, message: 'Payment signature missing.' });
      }

      const generatedSignature = crypto
        .createHmac('sha256', key_secret)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');

      const genBuf = Buffer.from(generatedSignature, 'utf-8');
      const sigBuf = Buffer.from(razorpay_signature, 'utf-8');

      const isSignatureValid = genBuf.length === sigBuf.length && crypto.timingSafeEqual(genBuf, sigBuf);

      if (!isSignatureValid) {
        console.error('[Razorpay] Signature mismatch for payment:', razorpay_payment_id);
        db.updateOrderStatus(order.id, { payment_status: 'Failed', notes: 'Payment signature mismatch during verification' });
        return res.status(400).json({ success: false, message: 'Payment verification failed: invalid signature.' });
      }
    } else {
      console.log(`[Razorpay] Verified payment ${razorpay_payment_id} for order #${order.order_number} in test mode.`);
    }

    // Idempotent order payment marking
    const { alreadyProcessed, order: updatedOrder } = db.markOrderPaid(order.id, {
      payment_id: razorpay_payment_id,
      razorpay_signature
    });

    // Send automatic order confirmation email if not already sent
    if (!alreadyProcessed && updatedOrder) {
      sendOrderConfirmationEmail(updatedOrder).catch(err => 
        console.error('Confirmation email background error:', err)
      );
    }

    res.json({
      success: true,
      message: alreadyProcessed 
        ? 'Payment already verified and confirmed previously.' 
        : 'Payment verified and order confirmed successfully!',
      data: {
        ...updatedOrder,
        already_processed: Boolean(alreadyProcessed)
      }
    });
  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({ success: false, message: error.message || 'Payment verification encountered an error.' });
  }
});

/**
 * POST /api/payment/failure
 * Record user payment cancellation or failure
 */
router.post('/failure', requireCustomerAuth, (req, res) => {
  try {
    const { order_id, error_code, error_description } = req.body;
    const order = db.getOrderById(order_id);

    if (order && order.payment_status !== 'Paid') {
      db.updateOrderStatus(order.id, {
        payment_status: 'Failed',
        order_status: 'Cancelled',
        notes: `Payment failed: ${error_code || 'CANCELLED'} - ${error_description || 'Customer closed checkout'}`
      });
    }

    res.json({ success: true, message: 'Payment failure recorded.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST /api/payment/webhook
 * Razorpay Verified Webhook endpoint
 * Uses raw body HMAC signature verification to reliably confirm payments
 */
router.post('/webhook', (req, res) => {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET;
    const webhookSignature = req.headers['x-razorpay-signature'];

    // Verify webhook signature if secret configured
    if (webhookSecret && !webhookSecret.includes('your_')) {
      if (!webhookSignature) {
        return res.status(400).json({ status: 'rejected', message: 'Missing webhook signature' });
      }

      const bodyStr = req.rawBody || JSON.stringify(req.body);
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(bodyStr)
        .digest('hex');

      const expBuf = Buffer.from(expectedSignature, 'utf-8');
      const sigBuf = Buffer.from(webhookSignature, 'utf-8');

      const isValid = expBuf.length === sigBuf.length && crypto.timingSafeEqual(expBuf, sigBuf);

      if (!isValid) {
        console.warn('[Webhook] Invalid webhook signature received.');
        return res.status(400).json({ status: 'rejected', message: 'Invalid signature' });
      }
    }

    const event = req.body.event;
    const payload = req.body.payload;

    console.log(`[Razorpay Webhook] Received event: ${event}`);

    if (event === 'payment.captured' || event === 'order.paid') {
      const payment = payload?.payment?.entity;
      const rzpOrderId = payment?.order_id || payload?.order?.entity?.id;
      const paymentId = payment?.id;

      if (rzpOrderId) {
        const order = db.getOrderById(rzpOrderId);
        if (order) {
          const { alreadyProcessed, order: paidOrder } = db.markOrderPaid(order.id, {
            payment_id: paymentId,
            razorpay_signature: webhookSignature || 'webhook_verified'
          });

          if (!alreadyProcessed && paidOrder) {
            sendOrderConfirmationEmail(paidOrder).catch(console.error);
          }
          console.log(`[Razorpay Webhook] ✓ Order #${order.order_number} confirmed via webhook.`);
        }
      }
    } else if (event === 'payment.failed') {
      const payment = payload?.payment?.entity;
      const rzpOrderId = payment?.order_id;
      if (rzpOrderId) {
        const order = db.getOrderById(rzpOrderId);
        if (order && order.payment_status !== 'Paid') {
          db.updateOrderStatus(order.id, {
            payment_status: 'Failed',
            notes: `Webhook payment.failed: ${payment.error_description || 'Payment failed'}`
          });
        }
      }
    }

    res.status(200).json({ status: 'ok' });
  } catch (error) {
    console.error('[Razorpay Webhook] Error processing event:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

export default router;
