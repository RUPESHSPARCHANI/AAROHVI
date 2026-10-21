import express from 'express';

const router = express.Router();

// Manager credentials
const MANAGER_CREDS = {
  email: 'tulsi@arohvi.in',
  username: 'admin',
  password: 'arohvi2026'
};

router.post('/login', (req, res) => {
  const { identifier, password } = req.body;

  if (
    (identifier === MANAGER_CREDS.email || identifier === MANAGER_CREDS.username) &&
    password === MANAGER_CREDS.password
  ) {
    // Generate simple token for session
    const token = 'arh_tok_' + Buffer.from(`${identifier}:${Date.now()}`).toString('base64');
    return res.json({
      success: true,
      message: 'Manager authenticated successfully',
      data: {
        token,
        manager: {
          name: 'Tulsi Prakash',
          role: 'Founder & Creative Director',
          email: MANAGER_CREDS.email
        }
      }
    });
  }

  res.status(401).json({
    success: false,
    message: 'Invalid manager credentials. Use email: tulsi@arohvi.in / password: arohvi2026'
  });
});

export default router;
