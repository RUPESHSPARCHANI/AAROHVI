import express from 'express';
import multer from 'multer';
import { uploadBufferToCloudinary, isCloudinaryConfigured } from '../config/cloudinary.js';
import { requireManagerAuth } from '../middleware/auth.js';

const router = express.Router();

// Configure Multer with Memory Storage (buffers kept in RAM before piping to Cloudinary)
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
 * Upload single image to Cloudinary (Protected with Manager Auth)
 */
router.post('/single', requireManagerAuth, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image file uploaded under field "image".' });
    }

    const uploadResult = await uploadBufferToCloudinary(req.file.buffer, req.file.originalname);

    res.status(200).json({
      success: true,
      message: 'Image uploaded successfully to Cloudinary',
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
 * Upload up to 10 images concurrently to Cloudinary for product gallery (Protected with Manager Auth)
 */
router.post('/multiple', requireManagerAuth, upload.array('images', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'No image files uploaded under field "images".' });
    }

    // Upload all files in parallel to Cloudinary
    const uploadPromises = req.files.map(file => 
      uploadBufferToCloudinary(file.buffer, file.originalname)
    );

    const results = await Promise.all(uploadPromises);

    const uploadedImages = results.map(r => ({
      url: r.secure_url,
      public_id: r.public_id,
      storage: r.storage,
      format: r.format
    }));

    res.status(200).json({
      success: true,
      message: `Successfully uploaded ${uploadedImages.length} images to Cloudinary`,
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
 * Check if Cloudinary is configured
 */
router.get('/status', (req, res) => {
  res.json({
    configured: isCloudinaryConfigured(),
    folder: process.env.CLOUDINARY_FOLDER || 'arohvi/products',
    cloudName: process.env.CLOUDINARY_CLOUD_NAME ? `${process.env.CLOUDINARY_CLOUD_NAME.slice(0, 3)}***` : 'not_set'
  });
});

export default router;
