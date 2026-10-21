import express from 'express';
import { db } from '../../../database/db.js';

const router = express.Router();

// GET store analytics for Manager
router.get('/', (req, res) => {
  try {
    const stats = db.getAnalytics();
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
