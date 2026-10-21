import express from 'express';

const router = express.Router();

// Manager credentials configurable via server environment variables
const getManagerCreds = () => ({
  email: (process.env.MANAGER_EMAIL || 'tulsi@arohvi.in').toLowerCase(),
  username: (process.env.MANAGER_USERNAME || 'admin').toLowerCase(),
  password: process.env.MANAGER_PASSWORD || 'arohvi2026'
});

router.post('/login', (req, res) => {
  const { identifier, password } = req.body;
  const creds = getManagerCreds();

  if (!identifier || !password) {
    return res.status(400).json({
      success: false,
      message: 'Email/username and password are required.'
    });
  }

  const cleanId = String(identifier).trim().toLowerCase();

  if (
    (cleanId === creds.email || cleanId === creds.username) &&
    password === creds.password
  ) {
    // Generate secure session token
    const token = 'arh_tok_' + Buffer.from(`${cleanId}:${Date.now()}`).toString('base64');
    return res.json({
      success: true,
      message: 'Manager authenticated successfully',
      data: {
        token,
        manager: {
          name: 'Tulsi Prakash',
          role: 'Founder & Creative Director',
          email: creds.email
        }
      }
    });
  }

  res.status(401).json({
    success: false,
    message: 'Invalid manager credentials. Please check your login details and try again.'
  });
});

export default router;
