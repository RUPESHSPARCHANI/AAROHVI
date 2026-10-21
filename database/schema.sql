-- AROHVI - Database Schema
-- Aesthetic: Dark Indian Maximalism
-- Supports SQLite and PostgreSQL

CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    tagline TEXT,
    price REAL NOT NULL,
    original_price REAL,
    category TEXT NOT NULL,
    material TEXT NOT NULL,
    finish TEXT NOT NULL,
    dimensions TEXT,
    care_instructions TEXT,
    story TEXT,
    styling_tip TEXT,
    stock INTEGER NOT NULL DEFAULT 10,
    in_stock INTEGER NOT NULL DEFAULT 1,
    image_url TEXT NOT NULL,
    gallery TEXT, -- JSON array of image URLs
    variants TEXT, -- JSON array of variant options (sizes/finishes)
    is_featured INTEGER DEFAULT 0,
    is_bestseller INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    order_number TEXT NOT NULL UNIQUE,
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    shipping_address TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    pincode TEXT NOT NULL,
    payment_method TEXT NOT NULL,
    payment_status TEXT NOT NULL DEFAULT 'Pending',
    order_status TEXT NOT NULL DEFAULT 'Pending', -- Pending, Confirmed, Shipped, Delivered, Cancelled
    items TEXT NOT NULL, -- JSON array of ordered items
    subtotal REAL NOT NULL,
    shipping_fee REAL NOT NULL DEFAULT 0,
    total_amount REAL NOT NULL,
    tracking_number TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS site_content (
    section_key TEXT PRIMARY KEY,
    title TEXT,
    subtitle TEXT,
    body_text TEXT,
    data_json TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS collections (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    tagline TEXT,
    description TEXT,
    image_url TEXT,
    display_order INTEGER DEFAULT 0
);
