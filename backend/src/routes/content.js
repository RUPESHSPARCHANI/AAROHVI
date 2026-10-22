import express from 'express';
import { db } from '../../../database/db.js';
import { requireManagerAuth } from '../middleware/auth.js';

const router = express.Router();

// GET all editable brand content (Hero, Announcement, Story, Policies, Settings) - Public
router.get('/', async (req, res) => {
  try {
    const content = await db.getSiteContent();
    res.json({ success: true, data: content });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT update section content (Protected with Manager Auth)
router.put('/:section', requireManagerAuth, async (req, res) => {
  try {
    const { section } = req.params;
    const updatedContent = await db.updateSiteContent(section, req.body);
    res.json({
      success: true,
      message: `Section '${section}' updated successfully`,
      data: updatedContent
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
