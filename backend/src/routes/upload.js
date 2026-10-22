import express from 'express';
import multer from 'multer';
import { uploadImage, getActiveStorageProvider } from '../config/storage.js';
import { requireManagerAuth } from '../middleware/auth.js';

const router = express.Router();

// Configure Multer with Memory Storage (buffers kept in RAM before piping to Supabase Storage/Cloudinary)
const storage = multer.memoryStorage();

// File filter to allow only image mime types
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif', 'image/svg+xml'];
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type: ${file.mimetype}. Only JPEG, PNG, WEBP, AVIF, and GIF images are allowed.`), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB maximum per image
  }
});

/**
 * POST /api/upload/single
 * Upload single image (Protected with Manager Auth)
 */
router.post('/single', requireManagerAuth, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image file uploaded under field "image".' });
    }

    const uploadResult = await uploadImage(req.file.buffer, req.file.originalname, req.file.mimetype);

    res.status(200).json({
      success: true,
      message: `Image uploaded successfully to ${uploadResult.storage}`,
      data: {
        url: uploadResult.secure_url,
        public_id: uploadResult.public_id,
        storage: uploadResult.storage,
        format: uploadResult.format,
        bytes: uploadResult.bytes
      }
    });
  } catch (error) {
    console.error('Upload Error:', error);
    res.status(500).json({ success: false, message: error.message || 'Image upload failed' });
  }
});

/**
 * POST /api/upload/multiple
 * Upload up to 10 images concurrently for product gallery (Protected with Manager Auth)
 */
router.post('/multiple', requireManagerAuth, upload.array('images', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'No image files uploaded under field "images".' });
    }

    // Upload all files in parallel
    const uploadPromises = req.files.map(file => 
      uploadImage(file.buffer, file.originalname, file.mimetype)
    );

    const results = await Promise.all(uploadPromises);

    const uploadedImages = results.map(r => ({
      url: r.secure_url,
      public_id: r.public_id,
      storage: r.storage,
      format: r.format
    }));

    const provider = uploadedImages[0]?.storage || 'storage';

    res.status(200).json({
      success: true,
      message: `Successfully uploaded ${uploadedImages.length} images to ${provider}`,
      count: uploadedImages.length,
      data: uploadedImages,
      urls: uploadedImages.map(img => img.url)
    });
  } catch (error) {
    console.error('Multiple Upload Error:', error);
    res.status(500).json({ success: false, message: error.message || 'Multiple image upload failed' });
  }
});

/**
 * GET /api/upload/status
 * Check active storage provider
 */
router.get('/status', (req, res) => {
  const provider = getActiveStorageProvider();
  res.json({
    configured: provider !== 'local_fallback',
    provider,
    bucket: process.env.SUPABASE_STORAGE_BUCKET || 'arohvi-products'
  });
});

export default router;
