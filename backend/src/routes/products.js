import express from 'express';
import { db } from '../../../database/db.js';
import { requireManagerAuth } from '../middleware/auth.js';

const router = express.Router();

// GET all products with filtering & search (Public)
router.get('/', async (req, res) => {
  try {
    const { category, search, minPrice, maxPrice, sort } = req.query;
    const products = await db.getProducts({ category, search, minPrice, maxPrice, sort });
    res.json({ success: true, count: products.length, data: products });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET product by ID or slug (Public)
router.get('/:id', async (req, res) => {
  try {
    const product = await db.getProductById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST create product (Protected with Manager Auth)
router.post('/', requireManagerAuth, async (req, res) => {
  try {
    const { name, price, gallery, image_url } = req.body;
    if (!name || !price) {
      return res.status(400).json({ success: false, message: 'Name and price are required' });
    }

    // Ensure gallery and image_url harmony
    let resolvedGallery = Array.isArray(gallery) && gallery.length > 0 ? gallery : [];
    let resolvedImageUrl = image_url;

    if (!resolvedImageUrl && resolvedGallery.length > 0) {
      resolvedImageUrl = resolvedGallery[0];
    }
    if (resolvedImageUrl && !resolvedGallery.includes(resolvedImageUrl)) {
      resolvedGallery.unshift(resolvedImageUrl);
    }

    const productPayload = {
      ...req.body,
      image_url: resolvedImageUrl || '/images/ring_sculptural.jpg',
      gallery: resolvedGallery.length > 0 ? resolvedGallery : [resolvedImageUrl || '/images/ring_sculptural.jpg']
    };

    const newProduct = await db.createProduct(productPayload);
    res.status(201).json({ success: true, message: 'Product created successfully', data: newProduct });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT update product (Protected with Manager Auth)
router.put('/:id', requireManagerAuth, async (req, res) => {
  try {
    const { gallery, image_url } = req.body;
    const updates = { ...req.body };

    if (Array.isArray(gallery)) {
      updates.gallery = gallery;
      if (!image_url && gallery.length > 0) {
        updates.image_url = gallery[0];
      }
    }

    const updated = await db.updateProduct(req.params.id, updates);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.json({ success: true, message: 'Product updated successfully', data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE product (Protected with Manager Auth)
router.delete('/:id', requireManagerAuth, async (req, res) => {
  try {
    const deleted = await db.deleteProduct(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
