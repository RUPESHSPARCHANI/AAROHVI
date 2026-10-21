// AROHVI API Client
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

export const api = {
  // Products
  async getProducts(params = {}) {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE_URL}/products${query ? `?${query}` : ''}`);
    return res.json();
  },

  async getProduct(id) {
    const res = await fetch(`${API_BASE_URL}/products/${id}`);
    return res.json();
  },

  async createProduct(productData, token) {
    const res = await fetch(`${API_BASE_URL}/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(productData)
    });
    return res.json();
  },

  async updateProduct(id, productData, token) {
    const res = await fetch(`${API_BASE_URL}/products/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(productData)
    });
    return res.json();
  },

  async deleteProduct(id, token) {
    const res = await fetch(`${API_BASE_URL}/products/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return res.json();
  },

  // Orders
  async createOrder(orderData) {
    const res = await fetch(`${API_BASE_URL}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData)
    });
    return res.json();
  },

  async getOrders(status, token) {
    const url = status && status !== 'all' 
      ? `${API_BASE_URL}/orders?status=${status}` 
      : `${API_BASE_URL}/orders`;
    const res = await fetch(url, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return res.json();
  },

  async getOrder(id) {
    const res = await fetch(`${API_BASE_URL}/orders/${id}`);
    return res.json();
  },

  async updateOrderStatus(id, statusData, token) {
    const res = await fetch(`${API_BASE_URL}/orders/${id}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(statusData)
    });
    return res.json();
  },

  // Brand Content
  async getContent() {
    const res = await fetch(`${API_BASE_URL}/content`);
    return res.json();
  },

  async updateContent(section, data, token) {
    const res = await fetch(`${API_BASE_URL}/content/${section}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  // Analytics
  async getAnalytics(token) {
    const res = await fetch(`${API_BASE_URL}/analytics`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return res.json();
  },

  // Manager Auth
  async login(credentials) {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });
    return res.json();
  }
};
