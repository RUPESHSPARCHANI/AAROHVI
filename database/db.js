// AROHVI Database Engine
// Deployment-ready: zero external native build dependencies, transactional JSON-backed SQL/Store
// Persists directly to `database/arohvi_store.json` with auto-seeding

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { defaultProducts, defaultSiteContent, defaultOrders } from './seedData.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE_PATH = path.join(__dirname, 'arohvi_store.json');

class DatabaseEngine {
  constructor() {
    this.data = {
      products: [],
      orders: [],
      siteContent: {},
      collections: []
    };
    this.init();
  }

  init() {
    try {
      if (fs.existsSync(DB_FILE_PATH)) {
        const raw = fs.readFileSync(DB_FILE_PATH, 'utf-8');
        this.data = JSON.parse(raw);
        // Ensure structure integrity
        if (!this.data.products || this.data.products.length === 0) {
          this.data.products = [...defaultProducts];
        }
        if (!this.data.siteContent || Object.keys(this.data.siteContent).length === 0) {
          this.data.siteContent = { ...defaultSiteContent };
        }
        if (!this.data.orders) {
          this.data.orders = [...defaultOrders];
        }
      } else {
        // First run seed
        this.data = {
          products: [...defaultProducts],
          orders: [...defaultOrders],
          siteContent: { ...defaultSiteContent },
          collections: [
            { id: "col-1", name: "All Adornments", slug: "all" },
            { id: "col-2", name: "Rings", slug: "rings" },
            { id: "col-3", name: "Earrings", slug: "earrings" },
            { id: "col-4", name: "Cuffs & Kadas", slug: "cuffs-kadas" },
            { id: "col-5", name: "Necklaces & Haslis", slug: "necklaces-haslis" }
          ]
        };
        this.save();
      }
    } catch (err) {
      console.error("Database init error, falling back to defaults:", err);
      this.data = {
        products: [...defaultProducts],
        orders: [...defaultOrders],
        siteContent: { ...defaultSiteContent },
        collections: []
      };
    }
  }

  save() {
    try {
      fs.writeFileSync(DB_FILE_PATH, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error("Failed to persist database file:", err);
    }
  }

  // --- PRODUCTS ---
  getProducts(filters = {}) {
    let list = [...this.data.products];

    if (filters.category && filters.category !== 'all' && filters.category !== 'All') {
      list = list.filter(p => p.category.toLowerCase() === filters.category.toLowerCase() || 
        (filters.category.toLowerCase().includes('ring') && p.category.toLowerCase().includes('ring')) ||
        (filters.category.toLowerCase().includes('earring') && p.category.toLowerCase().includes('earring')) ||
        (filters.category.toLowerCase().includes('cuff') && p.category.toLowerCase().includes('cuff')) ||
        (filters.category.toLowerCase().includes('neck') && p.category.toLowerCase().includes('neck'))
      );
    }

    if (filters.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(p => 
        p.name.toLowerCase().includes(q) || 
        (p.tagline && p.tagline.toLowerCase().includes(q)) ||
        p.category.toLowerCase().includes(q) ||
        (p.material && p.material.toLowerCase().includes(q))
      );
    }

    if (filters.minPrice !== undefined) {
      list = list.filter(p => p.price >= Number(filters.minPrice));
    }
    if (filters.maxPrice !== undefined) {
      list = list.filter(p => p.price <= Number(filters.maxPrice));
    }

    if (filters.sort) {
      if (filters.sort === 'price_asc') {
        list.sort((a, b) => a.price - b.price);
      } else if (filters.sort === 'price_desc') {
        list.sort((a, b) => b.price - a.price);
      } else if (filters.sort === 'newest') {
        list.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
      } else if (filters.sort === 'bestseller') {
        list.sort((a, b) => (b.is_bestseller || 0) - (a.is_bestseller || 0));
      }
    }

    return list;
  }

  getProductById(id) {
    return this.data.products.find(p => p.id === id || p.slug === id);
  }

  createProduct(productData) {
    const id = "prod-" + Date.now();
    const slug = (productData.name || "piece")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '') + '-' + Math.floor(Math.random() * 1000);

    const newProduct = {
      id,
      slug,
      name: productData.name,
      tagline: productData.tagline || "",
      price: Number(productData.price) || 299,
      original_price: productData.original_price ? Number(productData.original_price) : null,
      category: productData.category || "General",
      material: productData.material || "Oxidised Silver Alloy",
      finish: productData.finish || "Antique Patina",
      dimensions: productData.dimensions || "Standard Size",
      care_instructions: productData.care_instructions || "Store in airtight cloth pouch.",
      story: productData.story || "",
      styling_tip: productData.styling_tip || "",
      stock: Number(productData.stock) >= 0 ? Number(productData.stock) : 10,
      in_stock: Number(productData.stock) > 0 ? 1 : 0,
      image_url: productData.image_url || "/images/ring_sculptural.jpg",
      gallery: Array.isArray(productData.gallery) && productData.gallery.length > 0 
        ? productData.gallery 
        : [productData.image_url || "/images/ring_sculptural.jpg"],
      variants: productData.variants || [{ id: "v1", name: "Standard Fit", stock: Number(productData.stock) || 10 }],
      is_featured: productData.is_featured ? 1 : 0,
      is_bestseller: productData.is_bestseller ? 1 : 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    this.data.products.unshift(newProduct);
    this.save();
    return newProduct;
  }

  updateProduct(id, updates) {
    const idx = this.data.products.findIndex(p => p.id === id || p.slug === id);
    if (idx === -1) return null;

    const existing = this.data.products[idx];
    const updated = {
      ...existing,
      ...updates,
      price: updates.price !== undefined ? Number(updates.price) : existing.price,
      stock: updates.stock !== undefined ? Number(updates.stock) : existing.stock,
      in_stock: updates.stock !== undefined ? (Number(updates.stock) > 0 ? 1 : 0) : existing.in_stock,
      updated_at: new Date().toISOString()
    };

    this.data.products[idx] = updated;
    this.save();
    return updated;
  }

  deleteProduct(id) {
    const idx = this.data.products.findIndex(p => p.id === id || p.slug === id);
    if (idx === -1) return false;
    this.data.products.splice(idx, 1);
    this.save();
    return true;
  }

  // --- ORDERS ---
  getOrders(statusFilter) {
    if (!statusFilter || statusFilter === 'all' || statusFilter === 'All') {
      return this.data.orders;
    }
    return this.data.orders.filter(o => o.order_status.toLowerCase() === statusFilter.toLowerCase());
  }

  getOrderById(id) {
    return this.data.orders.find(o => o.id === id || o.order_number === id);
  }

  createOrder(orderPayload) {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const order_number = `ARH-${new Date().getFullYear()}-${randomSuffix}`;
    const id = "ord-" + Date.now();

    // Calculate subtotal
    const items = orderPayload.items || [];
    let subtotal = 0;
    items.forEach(item => {
      subtotal += (Number(item.price) || 0) * (Number(item.quantity) || 1);
      
      // Auto-decrement product stock
      const prod = this.getProductById(item.id);
      if (prod) {
        const newStock = Math.max(0, (prod.stock || 0) - (Number(item.quantity) || 1));
        this.updateProduct(prod.id, { stock: newStock });
      }
    });

    const settings = this.data.siteContent?.settings || { freeShippingThreshold: 499, standardShippingFee: 49 };
    const shipping_fee = subtotal >= settings.freeShippingThreshold ? 0 : settings.standardShippingFee;
    const total_amount = subtotal + shipping_fee;

    const newOrder = {
      id,
      order_number,
      customer_name: orderPayload.customer_name,
      customer_email: orderPayload.customer_email,
      customer_phone: orderPayload.customer_phone,
      shipping_address: orderPayload.shipping_address,
      city: orderPayload.city,
      state: orderPayload.state,
      pincode: orderPayload.pincode,
      payment_method: orderPayload.payment_method || "UPI",
      payment_status: orderPayload.payment_method === "Cash on Delivery (COD)" ? "Pending" : "Paid",
      order_status: "Confirmed",
      items,
      subtotal,
      shipping_fee,
      total_amount,
      tracking_number: null,
      notes: orderPayload.notes || "",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    this.data.orders.unshift(newOrder);
    this.save();
    return newOrder;
  }

  updateOrderStatus(id, { order_status, tracking_number }) {
    const order = this.getOrderById(id);
    if (!order) return null;

    if (order_status) order.order_status = order_status;
    if (tracking_number !== undefined) order.tracking_number = tracking_number;
    order.updated_at = new Date().toISOString();

    this.save();
    return order;
  }

  // --- CONTENT ---
  getSiteContent() {
    return this.data.siteContent || defaultSiteContent;
  }

  updateSiteContent(section, updates) {
    if (!this.data.siteContent) this.data.siteContent = { ...defaultSiteContent };
    this.data.siteContent[section] = {
      ...this.data.siteContent[section],
      ...updates
    };
    this.save();
    return this.data.siteContent;
  }

  // --- ANALYTICS ---
  getAnalytics() {
    const orders = this.data.orders || [];
    const products = this.data.products || [];

    const totalRevenue = orders.reduce((sum, o) => {
      if (o.order_status !== 'Cancelled') {
        return sum + (Number(o.total_amount) || 0);
      }
      return sum;
    }, 0);

    const totalOrders = orders.length;
    const averageOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;
    const lowStockProducts = products.filter(p => (p.stock || 0) < 5);

    // Sales by status
    const statusCounts = {
      Pending: orders.filter(o => o.order_status === 'Pending').length,
      Confirmed: orders.filter(o => o.order_status === 'Confirmed').length,
      Shipped: orders.filter(o => o.order_status === 'Shipped').length,
      Delivered: orders.filter(o => o.order_status === 'Delivered').length,
      Cancelled: orders.filter(o => o.order_status === 'Cancelled').length
    };

    return {
      totalRevenue,
      totalOrders,
      averageOrderValue,
      totalProducts: products.length,
      lowStockCount: lowStockProducts.length,
      lowStockProducts,
      statusCounts,
      recentOrders: orders.slice(0, 5)
    };
  }
}

export const db = new DatabaseEngine();
