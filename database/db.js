// AROHVI Database Engine
// Deployment-ready: zero external native build dependencies, transactional JSON-backed SQL/Store
// Persists directly to `database/arohvi_store.json` with auto-seeding

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
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
      customers: [],
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
        if (!this.data.customers) {
          this.data.customers = [];
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

  // --- ORDERS & PAYMENTS ---
  validateAndPriceItems(rawItems = []) {
    if (!Array.isArray(rawItems) || rawItems.length === 0) {
      throw new Error('Your cart is empty. Please add items to proceed.');
    }

    let subtotal = 0;
    const verifiedItems = rawItems.map(raw => {
      const prodId = raw.id || raw.product_id;
      const product = this.getProductById(prodId);

      if (!product) {
        throw new Error(`Product "${raw.name || prodId}" was not found in our catalog.`);
      }

      const qty = Math.max(1, parseInt(raw.quantity, 10) || 1);
      const stock = product.stock !== undefined ? product.stock : 10;

      if (stock < qty) {
        throw new Error(`Insufficient stock for "${product.name}". Only ${stock} pieces available.`);
      }

      const authoritativePrice = Number(product.price);
      subtotal += authoritativePrice * qty;

      return {
        id: product.id,
        product_id: product.id,
        name: product.name,
        price: authoritativePrice,
        quantity: qty,
        variant: raw.variant || null,
        image_url: product.image_url || product.gallery?.[0] || '/images/ring_sculptural.jpg'
      };
    });

    const settings = this.data.siteContent?.settings || { freeShippingThreshold: 499, standardShippingFee: 49 };
    const threshold = Number(settings.freeShippingThreshold) || 499;
    const fee = Number(settings.standardShippingFee) || 49;
    const shipping_fee = subtotal >= threshold ? 0 : fee;
    const total_amount = subtotal + shipping_fee;

    return {
      verifiedItems,
      subtotal,
      shipping_fee,
      total_amount
    };
  }

  getOrders(statusFilter) {
    if (!statusFilter || statusFilter === 'all' || statusFilter === 'All') {
      return this.data.orders || [];
    }
    return (this.data.orders || []).filter(o => 
      o.order_status.toLowerCase() === statusFilter.toLowerCase()
    );
  }

  getOrderById(id) {
    if (!id) return null;
    return (this.data.orders || []).find(o => 
      o.id === id || 
      o.order_number === id || 
      o.razorpay_order_id === id
    );
  }

  createOrder(orderPayload) {
    // Authoritatively price and validate stock on the server
    const { verifiedItems, subtotal, shipping_fee, total_amount } = this.validateAndPriceItems(orderPayload.items);

    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const order_number = `ARH-${new Date().getFullYear()}-${randomSuffix}`;
    const id = "ord-" + Date.now();

    const isCod = orderPayload.payment_method === 'Cash on Delivery (COD)';
    const payment_method = orderPayload.payment_method || 'Razorpay Online (UPI/Cards/NetBanking)';
    const payment_status = isCod ? 'Pending' : (orderPayload.payment_status || 'Pending');
    const order_status = isCod ? 'Confirmed' : (orderPayload.order_status || 'Pending Payment');

    // Auto-reserve stock if COD or pre-authorized
    if (isCod) {
      verifiedItems.forEach(item => {
        const prod = this.getProductById(item.id);
        if (prod) {
          const newStock = Math.max(0, (prod.stock || 0) - item.quantity);
          this.updateProduct(prod.id, { stock: newStock });
        }
      });
    }

    const newOrder = {
      id,
      order_number,
      customer_id: orderPayload.customer_id || null,
      customer_name: String(orderPayload.customer_name).trim(),
      customer_email: String(orderPayload.customer_email).trim().toLowerCase(),
      customer_phone: String(orderPayload.customer_phone).trim(),
      shipping_address: String(orderPayload.shipping_address).trim(),
      city: String(orderPayload.city || 'Bengaluru').trim(),
      state: String(orderPayload.state || 'Karnataka').trim(),
      pincode: String(orderPayload.pincode || '560001').trim(),
      delivery_instructions: orderPayload.delivery_instructions ? String(orderPayload.delivery_instructions).trim() : '',
      payment_method,
      payment_status,
      order_status,
      razorpay_order_id: orderPayload.razorpay_order_id || null,
      razorpay_payment_id: orderPayload.razorpay_payment_id || null,
      razorpay_signature: orderPayload.razorpay_signature || null,
      items: verifiedItems,
      subtotal,
      shipping_fee,
      total_amount,
      courier_name: null,
      tracking_number: null,
      tracking_url: null,
      estimated_delivery: null,
      email_sent: false,
      email_sent_at: null,
      payment_verified_at: null,
      notes: orderPayload.notes || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    if (!this.data.orders) this.data.orders = [];
    this.data.orders.unshift(newOrder);
    this.save();
    return newOrder;
  }

  markOrderPaid(orderIdOrNumber, { payment_id, razorpay_signature }) {
    const order = this.getOrderById(orderIdOrNumber);
    if (!order) return null;

    // Idempotency: prevent duplicate payment processing
    if (order.payment_status === 'Paid') {
      return { alreadyProcessed: true, order };
    }

    // Deduct stock on successful payment confirmation
    (order.items || []).forEach(item => {
      const prod = this.getProductById(item.id);
      if (prod) {
        const newStock = Math.max(0, (prod.stock || 0) - (Number(item.quantity) || 1));
        this.updateProduct(prod.id, { stock: newStock });
      }
    });

    order.payment_status = 'Paid';
    order.order_status = 'Confirmed';
    order.razorpay_payment_id = payment_id;
    if (razorpay_signature) order.razorpay_signature = razorpay_signature;
    order.payment_verified_at = new Date().toISOString();
    order.updated_at = new Date().toISOString();

    this.save();
    return { alreadyProcessed: false, order };
  }

  updateOrderStatus(id, updates = {}) {
    const order = this.getOrderById(id);
    if (!order) return null;

    const previousStatus = order.order_status;
    const newStatus = updates.order_status;

    // Automatic inventory reconciliation on cancellation or refund
    if (newStatus && newStatus !== previousStatus) {
      if ((newStatus === 'Cancelled' || newStatus === 'Refunded') && 
          previousStatus !== 'Cancelled' && previousStatus !== 'Refunded') {
        // Restore inventory back to products
        (order.items || []).forEach(item => {
          const prod = this.getProductById(item.id);
          if (prod) {
            this.updateProduct(prod.id, { stock: (prod.stock || 0) + (Number(item.quantity) || 1) });
          }
        });
      } else if ((previousStatus === 'Cancelled' || previousStatus === 'Refunded') && 
                 newStatus !== 'Cancelled' && newStatus !== 'Refunded') {
        // Re-decrement inventory if restored
        (order.items || []).forEach(item => {
          const prod = this.getProductById(item.id);
          if (prod) {
            this.updateProduct(prod.id, { stock: Math.max(0, (prod.stock || 0) - (Number(item.quantity) || 1)) });
          }
        });
      }
      order.order_status = newStatus;
    }

    if (updates.payment_status !== undefined) order.payment_status = updates.payment_status;
    if (updates.courier_name !== undefined) order.courier_name = updates.courier_name;
    if (updates.tracking_number !== undefined) order.tracking_number = updates.tracking_number;
    if (updates.tracking_url !== undefined) order.tracking_url = updates.tracking_url;
    if (updates.estimated_delivery !== undefined) order.estimated_delivery = updates.estimated_delivery;
    if (updates.shipping_fee !== undefined) {
      order.shipping_fee = Number(updates.shipping_fee);
      order.total_amount = (order.subtotal || 0) + order.shipping_fee;
    }
    if (updates.notes !== undefined) order.notes = updates.notes;

    order.updated_at = new Date().toISOString();
    this.save();
    return order;
  }

  markEmailSent(id) {
    const order = this.getOrderById(id);
    if (!order) return null;
    order.email_sent = true;
    order.email_sent_at = new Date().toISOString();
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

  // --- CUSTOMER AUTH & PROFILES ---
  _hashPassword(password, salt) {
    return crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  }

  getCustomerByEmail(email) {
    if (!email) return null;
    const clean = String(email).trim().toLowerCase();
    return (this.data.customers || []).find(c => c.email && c.email.toLowerCase() === clean) || null;
  }

  getCustomerById(id) {
    if (!id) return null;
    const customer = (this.data.customers || []).find(c => c.id === id);
    if (!customer) return null;
    const { password_hash, salt, ...safeCustomer } = customer;
    return safeCustomer;
  }

  registerCustomer({ name, email, password, phone = '', address = '', city = 'Bengaluru', state = 'Karnataka', pincode = '560001' }) {
    if (!this.data.customers) this.data.customers = [];

    const cleanEmail = String(email).trim().toLowerCase();
    if (this.getCustomerByEmail(cleanEmail)) {
      throw new Error('An account with this email address already exists. Please sign in instead.');
    }

    if (!password || password.length < 6) {
      throw new Error('Password must be at least 6 characters long.');
    }

    const salt = crypto.randomBytes(16).toString('hex');
    const password_hash = this._hashPassword(password, salt);

    const newCustomer = {
      id: `cust-${Date.now()}`,
      name: String(name).trim(),
      email: cleanEmail,
      phone: String(phone).trim(),
      shipping_address: String(address).trim(),
      city: String(city).trim(),
      state: String(state).trim(),
      pincode: String(pincode).trim(),
      password_hash,
      salt,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    this.data.customers.push(newCustomer);
    this.save();

    const { password_hash: _h, salt: _s, ...safeCustomer } = newCustomer;
    return safeCustomer;
  }

  authenticateCustomer(email, password) {
    if (!email || !password) {
      throw new Error('Email and password are required.');
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const customer = (this.data.customers || []).find(c => c.email && c.email.toLowerCase() === cleanEmail);

    if (!customer) {
      throw new Error('No account found with this email. Please check your email or create an account.');
    }

    const inputHash = this._hashPassword(password, customer.salt);
    if (inputHash !== customer.password_hash) {
      throw new Error('Incorrect password. Please verify your credentials and try again.');
    }

    const { password_hash: _h, salt: _s, ...safeCustomer } = customer;
    return safeCustomer;
  }

  updateCustomer(id, updates = {}) {
    const customer = (this.data.customers || []).find(c => c.id === id);
    if (!customer) return null;

    if (updates.name) customer.name = String(updates.name).trim();
    if (updates.phone !== undefined) customer.phone = String(updates.phone).trim();
    if (updates.shipping_address !== undefined) customer.shipping_address = String(updates.shipping_address).trim();
    if (updates.city !== undefined) customer.city = String(updates.city).trim();
    if (updates.state !== undefined) customer.state = String(updates.state).trim();
    if (updates.pincode !== undefined) customer.pincode = String(updates.pincode).trim();
    customer.updated_at = new Date().toISOString();

    this.save();

    const { password_hash: _h, salt: _s, ...safeCustomer } = customer;
    return safeCustomer;
  }

  getCustomerOrders(emailOrCustomerId) {
    if (!emailOrCustomerId) return [];
    const term = String(emailOrCustomerId).trim().toLowerCase();
    return (this.data.orders || []).filter(order => 
      (order.customer_id && order.customer_id.toLowerCase() === term) ||
      (order.customer_email && order.customer_email.toLowerCase() === term)
    );
  }
}

export const db = new DatabaseEngine();
