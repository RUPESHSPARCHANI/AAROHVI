import express from 'express';
import { db } from '../../../database/db.js';

const router = express.Router();

// GET all editable brand content (Hero, Announcement, Story, Policies, Settings)
router.get('/', (req, res) => {
  try {
    const content = db.getSiteContent();
    res.json({ success: true, data: content });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT update section content (Manager)
router.put('/:section', (req, res) => {
  try {
    const { section } = req.params;
    const updatedContent = db.updateSiteContent(section, req.body);
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
