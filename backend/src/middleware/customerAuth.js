import { db } from '../../../database/db.js';

/**
 * Server-Side Authentication Middleware for Customers
 * Validates customer Bearer tokens (arh_cust_...)
 */
export const requireCustomerAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required. Please sign in to your customer account.'
    });
  }

  const token = authHeader.split(' ')[1];

  if (!token || !token.startsWith('arh_cust_')) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired customer session. Please sign in again.'
    });
  }

  try {
    const rawPayload = token.replace('arh_cust_', '');
    const decoded = Buffer.from(rawPayload, 'base64').toString('utf-8');
    const [customerId] = decoded.split(':');

    if (!customerId) {
      return res.status(401).json({
        success: false,
        message: 'Malformed customer authentication token.'
      });
    }

    const customer = await db.getCustomerById(customerId);
    if (!customer) {
      return res.status(401).json({
        success: false,
        message: 'Customer account not found or session has expired.'
      });
    }

    // Attach verified customer to request
    req.customer = customer;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Authentication verification failed: ' + err.message
    });
  }
};
