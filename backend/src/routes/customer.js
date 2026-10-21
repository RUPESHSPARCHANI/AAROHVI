import express from 'express';
import { db } from '../../../database/db.js';
import { requireCustomerAuth } from '../middleware/customerAuth.js';

const router = express.Router();

/**
 * Generate customer session token
 */
const generateCustomerToken = (customer) => {
  return 'arh_cust_' + Buffer.from(`${customer.id}:${Date.now()}`).toString('base64');
};

/**
 * POST /api/customer/register
 * Customer Sign-Up
 */
router.post('/register', (req, res) => {
  try {
    const { name, email, password, phone, address, city, state, pincode } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required to create an account.'
      });
    }

    const customer = db.registerCustomer({
      name,
      email,
      password,
      phone,
      address,
      city,
      state,
      pincode
    });

    const token = generateCustomerToken(customer);

    res.status(201).json({
      success: true,
      message: 'Welcome to AROHVI! Your account has been created.',
      data: {
        customer,
        token
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * POST /api/customer/login
 * Customer Sign-In
 */
router.post('/login', (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password.'
      });
    }

    const customer = db.authenticateCustomer(email, password);
    const token = generateCustomerToken(customer);

    res.json({
      success: true,
      message: `Welcome back, ${customer.name}!`,
      data: {
        customer,
        token
      }
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * GET /api/customer/profile
 * Get current customer profile (Protected)
 */
router.get('/profile', requireCustomerAuth, (req, res) => {
  try {
    res.json({
      success: true,
      data: req.customer
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * PUT /api/customer/profile
 * Update customer details and saved shipping address (Protected)
 */
router.put('/profile', requireCustomerAuth, (req, res) => {
  try {
    const updated = db.updateCustomer(req.customer.id, req.body);
    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'Customer account not found.'
      });
    }

    res.json({
      success: true,
      message: 'Your profile has been updated.',
      data: updated
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * GET /api/customer/orders
 * Get all past orders placed by this customer (Protected)
 */
router.get('/orders', requireCustomerAuth, (req, res) => {
  try {
    const orders = db.getCustomerOrders(req.customer.email);
    res.json({
      success: true,
      count: orders.length,
      data: orders
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

export default router;
