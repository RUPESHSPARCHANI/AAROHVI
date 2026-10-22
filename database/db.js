// AROHVI Universal Database Engine
// Supports both Supabase Cloud PostgreSQL and Local JSON Storage Engine
// Seamless automatic switching: when SUPABASE_URL & SUPABASE_KEY are provided,
// it runs directly against Supabase; otherwise it falls back to local JSON for offline development.

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { supabase, isSupabaseConfigured } from './supabaseClient.js';
import { defaultProducts, defaultSiteContent, defaultOrders } from './seedData.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE_PATH = path.join(__dirname, 'arohvi_store.json');

class DatabaseEngine {
  constructor() {
    this.localData = {
      products: [],
      orders: [],
      customers: [],
      siteContent: {},
      emailLogs: [],
      collections: []
    };
    this.initLocal();
    if (isSupabaseConfigured()) {
      console.log('⚡ [DatabaseEngine] Supabase PostgreSQL Connected: Production Cloud Mode Active');
    } else {
      console.log('📁 [DatabaseEngine] Supabase credentials not set: Running in Local JSON Storage Mode');
    }
  }

  initLocal() {
    try {
      if (fs.existsSync(DB_FILE_PATH)) {
        const raw = fs.readFileSync(DB_FILE_PATH, 'utf-8');
        this.localData = JSON.parse(raw);
        if (!this.localData.products || this.localData.products.length === 0) {
          this.localData.products = [...defaultProducts];
        }
        if (!this.localData.siteContent || Object.keys(this.localData.siteContent).length === 0) {
          this.localData.siteContent = { ...defaultSiteContent };
        }
        if (!this.localData.orders) this.localData.orders = [...defaultOrders];
        if (!this.localData.customers) this.localData.customers = [];
        if (!this.localData.emailLogs) this.localData.emailLogs = [];
      } else {
        this.localData = {
          products: [...defaultProducts],
          orders: [...defaultOrders],
          customers: [],
          emailLogs: [],
          siteContent: { ...defaultSiteContent },
          collections: [
            { id: "col-1", name: "All Adornments", slug: "all" },
            { id: "col-2", name: "Rings", slug: "rings" },
            { id: "col-3", name: "Earrings", slug: "earrings" },
            { id: "col-4", name: "Cuffs & Kadas", slug: "cuffs-kadas" },
            { id: "col-5", name: "Necklaces & Haslis", slug: "necklaces-haslis" }
          ]
        };
        this.saveLocal();
      }
    } catch (err) {
      console.error("Local database init error:", err);
      this.localData = {
        products: [...defaultProducts],
        orders: [...defaultOrders],
        customers: [],
        emailLogs: [],
        siteContent: { ...defaultSiteContent },
        collections: []
      };
    }
  }

  saveLocal() {
    try {
      fs.writeFileSync(DB_FILE_PATH, JSON.stringify(this.localData, null, 2), 'utf-8');
    } catch (err) {
      console.error("Failed to persist local database file:", err);
    }
  }

  _hashPassword(password, salt) {
    return crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  }

  // ============================================================
  // PRODUCTS CRUD
  // ============================================================
  async getProducts(filters = {}) {
    if (isSupabaseConfigured() && supabase) {
      let query = supabase.from('products').select('*');

      if (filters.category && filters.category !== 'all' && filters.category !== 'All') {
        const cat = filters.category.toLowerCase();
        if (cat.includes('ring')) query = query.ilike('category', '%ring%');
        else if (cat.includes('earring')) query = query.ilike('category', '%earring%');
        else if (cat.includes('cuff') || cat.includes('kada')) query = query.or('category.ilike.%cuff%,category.ilike.%kada%');
        else if (cat.includes('neck') || cat.includes('hasli')) query = query.or('category.ilike.%neck%,category.ilike.%hasli%');
        else query = query.eq('category', filters.category);
      }

      if (filters.search) {
        const term = `%${filters.search}%`;
        query = query.or(`name.ilike.${term},tagline.ilike.${term},category.ilike.${term}`);
      }

      if (filters.minPrice !== undefined) {
        query = query.gte('price', Number(filters.minPrice));
      }
      if (filters.maxPrice !== undefined) {
        query = query.lte('price', Number(filters.maxPrice));
      }

      if (filters.sort === 'price_asc') {
        query = query.order('price', { ascending: true });
      } else if (filters.sort === 'price_desc') {
        query = query.order('price', { ascending: false });
      } else if (filters.sort === 'bestseller') {
        query = query.order('is_bestseller', { ascending: false }).order('created_at', { ascending: false });
      } else {
        query = query.order('created_at', { ascending: false });
      }

      const { data, error } = await query;
      if (error) {
        console.error('[Supabase getProducts Error]', error);
        return this.localData.products;
      }
      return data || [];
    }

    // Local Fallback
    let list = [...this.localData.products];
    if (filters.category && filters.category !== 'all' && filters.category !== 'All') {
      const cat = filters.category.toLowerCase();
      list = list.filter(p => {
        const pCat = (p.category || '').toLowerCase();
        if (cat.includes('ring') && pCat.includes('ring')) return true;
        if (cat.includes('earring') && pCat.includes('earring')) return true;
        if ((cat.includes('cuff') || cat.includes('kada')) && (pCat.includes('cuff') || pCat.includes('kada'))) return true;
        if ((cat.includes('neck') || cat.includes('hasli')) && (pCat.includes('neck') || pCat.includes('hasli'))) return true;
        return pCat === cat;
      });
    }

    if (filters.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(p => 
        (p.name || '').toLowerCase().includes(q) || 
        (p.tagline && p.tagline.toLowerCase().includes(q)) ||
        (p.category || '').toLowerCase().includes(q)
      );
    }

    if (filters.minPrice !== undefined) {
      list = list.filter(p => Number(p.price) >= Number(filters.minPrice));
    }
    if (filters.maxPrice !== undefined) {
      list = list.filter(p => Number(p.price) <= Number(filters.maxPrice));
    }

    if (filters.sort === 'price_asc') {
      list.sort((a, b) => Number(a.price) - Number(b.price));
    } else if (filters.sort === 'price_desc') {
      list.sort((a, b) => Number(b.price) - Number(a.price));
    } else if (filters.sort === 'bestseller') {
      list.sort((a, b) => (Number(b.is_bestseller) || 0) - (Number(a.is_bestseller) || 0));
    }

    return list;
  }

  async getProductById(id) {
    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .or(`id.eq.${id},slug.eq.${id}`)
        .maybeSingle();

      if (error) {
        console.error('[Supabase getProductById Error]', error);
        return this.localData.products.find(p => p.id === id || p.slug === id);
      }
      return data;
    }

    return this.localData.products.find(p => p.id === id || p.slug === id) || null;
  }

  async createProduct(productData) {
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

    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase
        .from('products')
        .insert(newProduct)
        .select()
        .single();

      if (error) {
        console.error('[Supabase createProduct Error]', error);
        throw new Error(error.message);
      }
      return data;
    }

    this.localData.products.unshift(newProduct);
    this.saveLocal();
    return newProduct;
  }

  async updateProduct(id, updates) {
    const cleanUpdates = { ...updates, updated_at: new Date().toISOString() };
    if (cleanUpdates.price !== undefined) cleanUpdates.price = Number(cleanUpdates.price);
    if (cleanUpdates.stock !== undefined) {
      cleanUpdates.stock = Number(cleanUpdates.stock);
      cleanUpdates.in_stock = cleanUpdates.stock > 0 ? 1 : 0;
    }

    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase
        .from('products')
        .update(cleanUpdates)
        .or(`id.eq.${id},slug.eq.${id}`)
        .select()
        .single();

      if (error) {
        console.error('[Supabase updateProduct Error]', error);
        throw new Error(error.message);
      }
      return data;
    }

    const idx = this.localData.products.findIndex(p => p.id === id || p.slug === id);
    if (idx === -1) return null;
    this.localData.products[idx] = { ...this.localData.products[idx], ...cleanUpdates };
    this.saveLocal();
    return this.localData.products[idx];
  }

  async deleteProduct(id) {
    if (isSupabaseConfigured() && supabase) {
      const { error } = await supabase
        .from('products')
        .delete()
        .or(`id.eq.${id},slug.eq.${id}`);

      if (error) {
        console.error('[Supabase deleteProduct Error]', error);
        throw new Error(error.message);
      }
      return true;
    }

    const idx = this.localData.products.findIndex(p => p.id === id || p.slug === id);
    if (idx === -1) return false;
    this.localData.products.splice(idx, 1);
    this.saveLocal();
    return true;
  }

  // ============================================================
  // ORDERS CRUD
  // ============================================================
  async getOrders(status = null) {
    if (isSupabaseConfigured() && supabase) {
      let query = supabase.from('orders').select('*').order('created_at', { ascending: false });
      if (status && status !== 'All' && status !== 'all') {
        query = query.eq('order_status', status);
      }
      const { data, error } = await query;
      if (error) {
        console.error('[Supabase getOrders Error]', error);
        return this.localData.orders;
      }
      return data || [];
    }

    let list = [...this.localData.orders];
    if (status && status !== 'All' && status !== 'all') {
      list = list.filter(o => o.order_status === status);
    }
    return list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }

  async getOrderById(id) {
    if (!id) return null;
    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .or(`id.eq.${id},order_number.eq.${id},razorpay_order_id.eq.${id}`)
        .maybeSingle();

      if (error) {
        console.error('[Supabase getOrderById Error]', error);
        return this.localData.orders.find(o => o.id === id || o.order_number === id || o.razorpay_order_id === id);
      }
      return data;
    }

    return this.localData.orders.find(o => o.id === id || o.order_number === id || o.razorpay_order_id === id) || null;
  }

  async createOrder(orderData) {
    const id = "ord-" + Date.now();
    const orderNumber = "ARH-2026-" + Math.floor(1000 + Math.random() * 9000);

    // Compute totals server-side
    const items = Array.isArray(orderData.items) ? orderData.items : [];
    const subtotal = items.reduce((sum, item) => sum + (Number(item.price) * (Number(item.quantity) || 1)), 0);
    const shippingFee = subtotal >= 499 ? 0 : 49;
    const totalAmount = subtotal + shippingFee;

    const newOrder = {
      id,
      order_number: orderNumber,
      customer_id: orderData.customer_id || null,
      customer_name: String(orderData.customer_name || 'Collector').trim(),
      customer_email: String(orderData.customer_email || '').trim().toLowerCase(),
      customer_phone: String(orderData.customer_phone || '').trim(),
      shipping_address: String(orderData.shipping_address || '').trim(),
      city: String(orderData.city || 'Bengaluru').trim(),
      state: String(orderData.state || 'Karnataka').trim(),
      pincode: String(orderData.pincode || '').trim(),
      delivery_instructions: orderData.delivery_instructions ? String(orderData.delivery_instructions).trim() : '',
      payment_method: orderData.payment_method || 'Cash on Delivery (COD)',
      payment_status: orderData.payment_status || (orderData.payment_method?.includes('COD') ? 'Pending' : 'Paid'),
      order_status: orderData.order_status || 'Confirmed',
      items,
      subtotal,
      shipping_fee: shippingFee,
      total_amount: totalAmount,
      razorpay_order_id: orderData.razorpay_order_id || null,
      razorpay_payment_id: orderData.razorpay_payment_id || null,
      tracking_number: orderData.tracking_number || null,
      courier_name: orderData.courier_name || null,
      tracking_url: orderData.tracking_url || null,
      estimated_delivery: orderData.estimated_delivery || null,
      email_sent: false,
      notes: orderData.notes || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase
        .from('orders')
        .insert(newOrder)
        .select()
        .single();

      if (error) {
        console.error('[Supabase createOrder Error]', error);
        throw new Error(error.message);
      }

      const isCod = orderData.payment_method === 'Cash on Delivery (COD)';
      const shouldDeductStockImmediately = isCod || orderData.payment_status === 'Paid';

      // Decrement stock for ordered products in Supabase if COD or Paid
      if (shouldDeductStockImmediately) {
        for (const item of items) {
          if (item.id) {
            const prod = await this.getProductById(item.id);
            if (prod) {
              const newStock = Math.max(0, (Number(prod.stock) || 0) - (Number(item.quantity) || 1));
              await this.updateProduct(prod.id, { stock: newStock });
            }
          }
        }
      }

      return data;
    }

    // Local Fallback
    const isCod = orderData.payment_method === 'Cash on Delivery (COD)';
    const shouldDeductStockImmediately = isCod || orderData.payment_status === 'Paid';

    if (shouldDeductStockImmediately) {
      items.forEach(item => {
        const prod = this.localData.products.find(p => p.id === item.id);
        if (prod) {
          prod.stock = Math.max(0, (prod.stock || 0) - (Number(item.quantity) || 1));
          prod.in_stock = prod.stock > 0 ? 1 : 0;
        }
      });
    }

    this.localData.orders.unshift(newOrder);
    this.saveLocal();
    return newOrder;
  }

  async updateOrderStatus(id, updates) {
    const cleanUpdates = { ...updates, updated_at: new Date().toISOString() };

    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase
        .from('orders')
        .update(cleanUpdates)
        .or(`id.eq.${id},order_number.eq.${id}`)
        .select()
        .single();

      if (error) {
        console.error('[Supabase updateOrderStatus Error]', error);
        throw new Error(error.message);
      }
      return data;
    }

    const order = this.localData.orders.find(o => o.id === id || o.order_number === id);
    if (!order) return null;
    Object.assign(order, cleanUpdates);
    this.saveLocal();
    return order;
  }

  validateAndPriceItems(rawItems) {
    if (!Array.isArray(rawItems) || rawItems.length === 0) {
      throw new Error("Order must contain at least one piece.");
    }

    let subtotal = 0;
    const verifiedItems = rawItems.map(rawItem => {
      // Find authoritative product in catalog
      const product = this.localData.products.find(p => p.id === rawItem.id);
      if (!product) {
        throw new Error(`Piece "${rawItem.name || rawItem.id}" is no longer available in the catalog.`);
      }

      const qty = Math.max(1, parseInt(rawItem.quantity, 10) || 1);
      if ((product.stock || 0) < qty) {
        throw new Error(`Insufficient inventory for "${product.name}". Only ${product.stock} available.`);
      }

      const verifiedPrice = Number(product.price);
      subtotal += verifiedPrice * qty;

      return {
        id: product.id,
        name: product.name,
        price: verifiedPrice,
        quantity: qty,
        variant: rawItem.variant || (product.variants?.[0]?.name) || "Standard Fit",
        image_url: product.image_url
      };
    });

    const settings = this.localData.siteContent?.settings || { freeShippingThreshold: 499, standardShippingFee: 49 };
    const threshold = Number(settings.freeShippingThreshold) || 499;
    const fee = Number(settings.standardShippingFee) || 49;
    const shipping_fee = subtotal >= threshold ? 0 : fee;
    const total_amount = subtotal + shipping_fee;

    return { verifiedItems, subtotal, shipping_fee, total_amount };
  }

  async markOrderPaid(orderIdOrNumber, { payment_id, razorpay_signature }) {
    const order = await this.getOrderById(orderIdOrNumber);
    if (!order) return { alreadyProcessed: false, order: null };

    if (order.payment_status === 'Paid') {
      return { alreadyProcessed: true, order };
    }

    const updates = {
      payment_status: 'Paid',
      order_status: 'Confirmed',
      razorpay_payment_id: payment_id,
      razorpay_signature: razorpay_signature || null,
      updated_at: new Date().toISOString()
    };

    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase
        .from('orders')
        .update(updates)
        .or(`id.eq.${order.id},order_number.eq.${order.order_number}`)
        .select()
        .single();

      if (error) {
        console.error('[Supabase markOrderPaid Error]', error);
        throw new Error(error.message);
      }

      // Decrement stock for ordered products in Supabase
      for (const item of (order.items || [])) {
        if (item.id) {
          const prod = await this.getProductById(item.id);
          if (prod) {
            const newStock = Math.max(0, (Number(prod.stock) || 0) - (Number(item.quantity) || 1));
            await this.updateProduct(prod.id, { stock: newStock });
          }
        }
      }

      return { alreadyProcessed: false, order: data };
    }

    // Local Fallback
    (order.items || []).forEach(item => {
      const prod = this.localData.products.find(p => p.id === item.id);
      if (prod) {
        prod.stock = Math.max(0, (prod.stock || 0) - (Number(item.quantity) || 1));
        prod.in_stock = prod.stock > 0 ? 1 : 0;
      }
    });

    Object.assign(order, updates);
    this.saveLocal();
    return { alreadyProcessed: false, order };
  }

  save() {
    this.saveLocal();
  }

  async markEmailSent(id) {
    const updates = { email_sent: true, email_sent_at: new Date().toISOString() };
    if (isSupabaseConfigured() && supabase) {
      await supabase
        .from('orders')
        .update(updates)
        .or(`id.eq.${id},order_number.eq.${id}`);
      return;
    }

    const order = this.localData.orders.find(o => o.id === id || o.order_number === id);
    if (order) {
      Object.assign(order, updates);
      this.saveLocal();
    }
  }

  async logEmail({ order_id, order_number, recipient_email, subject, status = 'Sent', provider = 'resend', error_message = null }) {
    const logEntry = {
      id: `email-${Date.now()}`,
      order_id,
      order_number,
      recipient_email,
      subject,
      status,
      provider,
      error_message,
      created_at: new Date().toISOString()
    };

    if (isSupabaseConfigured() && supabase) {
      try {
        await supabase.from('email_logs').insert(logEntry);
      } catch (err) {
        console.error('[Supabase logEmail Error]', err);
      }
      return;
    }

    if (!this.localData.emailLogs) this.localData.emailLogs = [];
    this.localData.emailLogs.unshift(logEntry);
    this.saveLocal();
  }

  // ============================================================
  // CUSTOMER AUTH & PROFILES
  // ============================================================
  async getCustomerByEmail(email) {
    if (!email) return null;
    const cleanEmail = String(email).trim().toLowerCase();

    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('email', cleanEmail)
        .maybeSingle();

      if (error) {
        console.error('[Supabase getCustomerByEmail Error]', error);
        return null;
      }
      return data;
    }

    return (this.localData.customers || []).find(c => c.email && c.email.toLowerCase() === cleanEmail) || null;
  }

  async getCustomerById(id) {
    if (!id) return null;

    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase
        .from('customers')
        .select('id, name, email, phone, shipping_address, city, state, pincode, created_at, updated_at')
        .eq('id', id)
        .maybeSingle();

      if (error) {
        console.error('[Supabase getCustomerById Error]', error);
        return null;
      }
      return data;
    }

    const customer = (this.localData.customers || []).find(c => c.id === id);
    if (!customer) return null;
    const { password_hash, salt, ...safeCustomer } = customer;
    return safeCustomer;
  }

  async registerCustomer({ name, email, password, phone = '', address = '', city = 'Bengaluru', state = 'Karnataka', pincode = '560001' }) {
    const cleanEmail = String(email).trim().toLowerCase();
    const existing = await this.getCustomerByEmail(cleanEmail);
    if (existing) {
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

    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase
        .from('customers')
        .insert(newCustomer)
        .select('id, name, email, phone, shipping_address, city, state, pincode, created_at, updated_at')
        .single();

      if (error) {
        console.error('[Supabase registerCustomer Error]', error);
        throw new Error(error.message);
      }
      return data;
    }

    if (!this.localData.customers) this.localData.customers = [];
    this.localData.customers.push(newCustomer);
    this.saveLocal();

    const { password_hash: _h, salt: _s, ...safeCustomer } = newCustomer;
    return safeCustomer;
  }

  async authenticateCustomer(email, password) {
    if (!email || !password) {
      throw new Error('Email and password are required.');
    }

    const customer = await this.getCustomerByEmail(email);
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

  async updateCustomer(id, updates = {}) {
    const cleanUpdates = { ...updates, updated_at: new Date().toISOString() };
    delete cleanUpdates.password;
    delete cleanUpdates.password_hash;
    delete cleanUpdates.salt;
    delete cleanUpdates.email; // Email is immutable identity

    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase
        .from('customers')
        .update(cleanUpdates)
        .eq('id', id)
        .select('id, name, email, phone, shipping_address, city, state, pincode, created_at, updated_at')
        .single();

      if (error) {
        console.error('[Supabase updateCustomer Error]', error);
        throw new Error(error.message);
      }
      return data;
    }

    const customer = (this.localData.customers || []).find(c => c.id === id);
    if (!customer) return null;
    Object.assign(customer, cleanUpdates);
    this.saveLocal();
    const { password_hash: _h, salt: _s, ...safeCustomer } = customer;
    return safeCustomer;
  }

  async getCustomerOrders(emailOrCustomerId) {
    if (!emailOrCustomerId) return [];
    const term = String(emailOrCustomerId).trim().toLowerCase();

    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .or(`customer_id.eq.${emailOrCustomerId},customer_email.eq.${term}`)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[Supabase getCustomerOrders Error]', error);
        return [];
      }
      return data || [];
    }

    return (this.localData.orders || []).filter(order => 
      (order.customer_id && order.customer_id.toLowerCase() === term) ||
      (order.customer_email && order.customer_email.toLowerCase() === term)
    );
  }

  // ============================================================
  // SITE CONTENT & MANIFESTO
  // ============================================================
  async getSiteContent() {
    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase
        .from('site_content')
        .select('*');

      if (error || !data || data.length === 0) {
        return this.localData.siteContent || defaultSiteContent;
      }

      const formatted = { ...defaultSiteContent };
      data.forEach(row => {
        formatted[row.section_key] = {
          title: row.title,
          subtitle: row.subtitle,
          body_text: row.body_text,
          ...(row.data_json || {})
        };
      });
      return formatted;
    }

    return this.localData.siteContent || defaultSiteContent;
  }

  async updateSiteContent(section, updates) {
    if (isSupabaseConfigured() && supabase) {
      const row = {
        section_key: section,
        title: updates.title || updates.headline || '',
        subtitle: updates.subtitle || updates.subheadline || '',
        body_text: updates.body_text || updates.tagline || '',
        data_json: updates,
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('site_content')
        .upsert(row, { onConflict: 'section_key' })
        .select()
        .single();

      if (error) {
        console.error('[Supabase updateSiteContent Error]', error);
        throw new Error(error.message);
      }
      return await this.getSiteContent();
    }

    if (!this.localData.siteContent) this.localData.siteContent = { ...defaultSiteContent };
    this.localData.siteContent[section] = {
      ...this.localData.siteContent[section],
      ...updates
    };
    this.saveLocal();
    return this.localData.siteContent;
  }

  // ============================================================
  // ANALYTICS CALCULATION
  // ============================================================
  async getAnalytics() {
    const orders = await this.getOrders();
    const products = await this.getProducts();

    const totalRevenue = orders.reduce((sum, o) => {
      if (o.order_status !== 'Cancelled') {
        return sum + (Number(o.total_amount) || 0);
      }
      return sum;
    }, 0);

    const totalOrders = orders.length;
    const averageOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;
    const lowStockProducts = products.filter(p => (Number(p.stock) || 0) < 5);

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
