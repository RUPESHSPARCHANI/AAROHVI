import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

import productRoutes from './routes/products.js';
import orderRoutes from './routes/orders.js';
import contentRoutes from './routes/content.js';
import analyticsRoutes from './routes/analytics.js';
import authRoutes from './routes/auth.js';
import uploadRoutes from './routes/upload.js';
import customerRoutes from './routes/customer.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for frontend dev and production
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static images/uploads if needed
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/customer', customerRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    brand: 'AROHVI — Adorn the Unordinary',
    aesthetic: 'Dark Indian Maximalism',
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(`⚡ AROHVI Backend API Server Running`);
  console.log(`📍 URL: http://localhost:${PORT}`);
  console.log(`✨ Status: Healthy & Ready for Deployment`);
  console.log(`===============================================`);
});

export default app;
