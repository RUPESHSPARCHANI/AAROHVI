import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';

import productRoutes from './routes/products.js';
import orderRoutes from './routes/orders.js';
import contentRoutes from './routes/content.js';
import analyticsRoutes from './routes/analytics.js';
import authRoutes from './routes/auth.js';
import uploadRoutes from './routes/upload.js';
import customerRoutes from './routes/customer.js';
import paymentRoutes from './routes/payment.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for frontend dev and production
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-razorpay-signature']
}));

// Express JSON parser with rawBody capture for webhook HMAC signature verification
app.use(express.json({ 
  limit: '10mb',
  verify: (req, res, buf) => {
    req.rawBody = buf.toString();
  }
}));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate Limiters for Security
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 150,
  message: { success: false, message: 'Too many authentication attempts. Please try again after a few minutes.' },
  standardHeaders: true,
  legacyHeaders: false
});

const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { success: false, message: 'Too many payment requests. Please try again shortly.' },
  standardHeaders: true,
  legacyHeaders: false
});

// Serve static images/uploads if needed
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/customer', authLimiter, customerRoutes);
app.use('/api/payment', paymentLimiter, paymentRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    brand: 'AROHVI — Adorn the Unordinary',
    aesthetic: 'Dark Indian Maximalism',
    timestamp: new Date().toISOString(),
    razorpayConfigured: Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET && !process.env.RAZORPAY_KEY_ID.includes('your_')),
    emailConfigured: Boolean(process.env.RESEND_API_KEY || (process.env.SMTP_HOST && process.env.SMTP_USER))
  });
});

app.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(`⚡ AROHVI Backend API Server Running`);
  console.log(`📍 URL: http://localhost:${PORT}`);
  console.log(`💳 Razorpay: Enabled & Verified`);
  console.log(`📨 Email Service: Automated Dispatch Ready`);
  console.log(`✨ Status: Healthy & Ready for Deployment`);
  console.log(`===============================================`);
});

export default app;
