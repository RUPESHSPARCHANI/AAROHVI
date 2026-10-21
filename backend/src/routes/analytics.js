import express from 'express';
import { db } from '../../../database/db.js';
import { requireManagerAuth } from '../middleware/auth.js';

const router = express.Router();

// GET store analytics (Protected with Manager Auth)
router.get('/', requireManagerAuth, (req, res) => {
  try {
    const stats = db.getAnalytics();
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
