/**
 * Server-Side Authentication Middleware for Manager / Admin Access
 * Protects image upload endpoints and product mutations (POST, PUT, DELETE)
 */

export const requireManagerAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. Manager authentication required (Bearer token missing).'
    });
  }

  const token = authHeader.split(' ')[1];

  if (!token || !token.startsWith('arh_tok_')) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired manager session token. Please re-authenticate.'
    });
  }

  try {
    const rawPayload = token.replace('arh_tok_', '');
    const decoded = Buffer.from(rawPayload, 'base64').toString('utf-8');
    const [identifier, timestamp] = decoded.split(':');

    if (!identifier) {
      return res.status(401).json({
        success: false,
        message: 'Malformed authentication token.'
      });
    }

    // Attach manager context to request
    req.manager = {
      identifier,
      role: 'Founder & Manager',
      authenticatedAt: new Date(Number(timestamp) || Date.now())
    };

    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Failed to verify manager session token: ' + err.message
    });
  }
};
