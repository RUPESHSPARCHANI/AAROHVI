import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingBag, 
  FileText, 
  Settings, 
  Plus, 
  Edit2, 
  Trash2, 
  Check, 
  X, 
  Truck, 
  DollarSign, 
  ExternalLink, 
  LogOut, 
  AlertTriangle,
  Save,
  Eye,
  RefreshCw,
  Upload,
  Image as ImageIcon,
  Star,
  Cloud
} from 'lucide-react';
import { useManager } from '../../context/ManagerContext';
import { api } from '../../api/client';
import { useNavigate } from 'react-router-dom';

export const ManagerDashboard = ({ onSwitchToStore, onRefreshProducts }) => {
  const { manager, token, logout } = useManager();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('overview');
  const [analytics, setAnalytics] = useState(null);
  const [productsList, setProductsList] = useState([]);
  const [ordersList, setOrdersList] = useState([]);
  const [orderFilter, setOrderFilter] = useState('all');
  const [siteContentData, setSiteContentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState('');

  // Modals
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [customImageUrl, setCustomImageUrl] = useState('');

  const [productForm, setProductForm] = useState({
    name: '',
    tagline: '',
    price: '',
    original_price: '',
    category: 'Rings',
    material: 'Solid 92.5 Oxidised Brass Alloy',
    finish: 'Antique Smoked Silver',
    dimensions: 'Adjustable Size',
    care_instructions: 'Store in airtight cloth pouch. Wipe clean after wear.',
    story: '',
    styling_tip: '',
    stock: 15,
    image_url: '/images/ring_sculptural.jpg',
    gallery: ['/images/ring_sculptural.jpg'],
    is_featured: 1,
    is_bestseller: 0
  });

  const [statusUpdateModal, setStatusUpdateModal] = useState({
    open: false,
    order: null,
    status: '',
    tracking_number: ''
  });

  // Cloudinary Multi-Image Upload Handler
  const handleMultipleFilesUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setUploadError('');

    try {
      const res = await api.uploadMultipleImages(files, token);
      if (res.success && res.data) {
        const newUrls = res.data.map(item => item.url);
        setProductForm(prev => {
          const updatedGallery = [...(prev.gallery || []), ...newUrls];
          return {
            ...prev,
            gallery: updatedGallery,
            image_url: prev.image_url || updatedGallery[0]
          };
        });
        showToast(`Uploaded ${newUrls.length} image(s) to Cloudinary!`);
      } else {
        setUploadError(res.message || 'Image upload failed.');
      }
    } catch (err) {
      setUploadError(err.message || 'Error uploading to Cloudinary.');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const handleSetPrimaryImage = (url) => {
    setProductForm(prev => ({ ...prev, image_url: url }));
    showToast('Cover image updated');
  };

  const handleRemoveGalleryImage = (indexToRemove) => {
    setProductForm(prev => {
      const updatedGallery = (prev.gallery || []).filter((_, i) => i !== indexToRemove);
      const newImageUrl = prev.image_url === (prev.gallery || [])[indexToRemove]
        ? (updatedGallery[0] || '')
        : prev.image_url;
      return {
        ...prev,
        gallery: updatedGallery,
        image_url: newImageUrl
      };
    });
  };

  const handleAddManualUrl = () => {
    if (!customImageUrl.trim()) return;
    const url = customImageUrl.trim();
    setProductForm(prev => {
      const updatedGallery = [...(prev.gallery || []), url];
      return {
        ...prev,
        gallery: updatedGallery,
        image_url: prev.image_url || url
      };
    });
    setCustomImageUrl('');
    showToast('Image added to gallery');
  };

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  };

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [analyticsRes, productsRes, ordersRes, contentRes] = await Promise.all([
        api.getAnalytics(token),
        api.getProducts(),
        api.getOrders('all', token),
        api.getContent()
      ]);

      if (analyticsRes.success) setAnalytics(analyticsRes.data);
      if (productsRes.success) setProductsList(productsRes.data);
      if (ordersRes.success) setOrdersList(ordersRes.data);
      if (contentRes.success) setSiteContentData(contentRes.data);
    } catch (err) {
      console.error("Manager fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // Handle Product Save (Create or Update)
  const handleSaveProduct = async (e) => {
    e.preventDefault();
    try {
      if (editingProduct) {
        const res = await api.updateProduct(editingProduct.id, productForm, token);
        if (res.success) {
          showToast(`Updated "${productForm.name}" successfully`);
          setIsProductModalOpen(false);
          setEditingProduct(null);
          loadAllData();
          if (onRefreshProducts) onRefreshProducts();
        }
      } else {
        const res = await api.createProduct(productForm, token);
        if (res.success) {
          showToast(`Added new piece "${productForm.name}"`);
          setIsProductModalOpen(false);
          loadAllData();
          if (onRefreshProducts) onRefreshProducts();
        }
      }
    } catch (err) {
      alert("Error saving product: " + err.message);
    }
  };

  const handleQuickStockChange = async (prod, delta) => {
    const newStock = Math.max(0, (prod.stock || 0) + delta);
    try {
      const res = await api.updateProduct(prod.id, { stock: newStock }, token);
      if (res.success) {
        showToast(`Stock for "${prod.name}" adjusted to ${newStock}`);
        loadAllData();
        if (onRefreshProducts) onRefreshProducts();
      }
    } catch (err) {
      alert("Failed to update stock: " + err.message);
    }
  };

  const openAddProductModal = () => {
    setEditingProduct(null);
    setUploadError('');
    setCustomImageUrl('');
    setProductForm({
      name: '',
      tagline: '',
      price: '',
      original_price: '',
      category: 'Rings',
      material: 'Solid 92.5 Oxidised Brass Alloy',
      finish: 'Antique Smoked Silver',
      dimensions: 'Adjustable Size',
      care_instructions: 'Store in airtight cloth pouch. Wipe clean after wear.',
      story: '',
      styling_tip: '',
      stock: 15,
      image_url: '/images/ring_sculptural.jpg',
      gallery: ['/images/ring_sculptural.jpg'],
      is_featured: 1,
      is_bestseller: 0
    });
    setIsProductModalOpen(true);
  };

  const openEditProductModal = (product) => {
    setEditingProduct(product);
    setUploadError('');
    setCustomImageUrl('');
    const resolvedGallery = Array.isArray(product.gallery) && product.gallery.length > 0
      ? product.gallery
      : [product.image_url || '/images/ring_sculptural.jpg'];

    setProductForm({
      name: product.name,
      tagline: product.tagline || '',
      price: product.price,
      original_price: product.original_price || '',
      category: product.category,
      material: product.material || '',
      finish: product.finish || '',
      dimensions: product.dimensions || '',
      care_instructions: product.care_instructions || '',
      story: product.story || '',
      styling_tip: product.styling_tip || '',
      stock: product.stock,
      image_url: product.image_url || resolvedGallery[0],
      gallery: resolvedGallery,
      is_featured: product.is_featured || 0,
      is_bestseller: product.is_bestseller || 0
    });
    setIsProductModalOpen(true);
  };

  const handleDeleteProduct = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) return;
    try {
      const res = await api.deleteProduct(id, token);
      if (res.success) {
        showToast(`Piece "${name}" removed from catalogue`);
        loadAllData();
        if (onRefreshProducts) onRefreshProducts();
      }
    } catch (err) {
      alert("Failed to delete: " + err.message);
    }
  };

  // Handle Order Status Update
  const handleUpdateOrderStatus = async (e) => {
    e.preventDefault();
    try {
      const { order, status, tracking_number } = statusUpdateModal;
      const res = await api.updateOrderStatus(order.id, { order_status: status, tracking_number }, token);
      if (res.success) {
        showToast(`Order #${order.order_number} marked as ${status}`);
        setStatusUpdateModal({ open: false, order: null, status: '', tracking_number: '' });
        loadAllData();
      }
    } catch (err) {
      alert("Status update failed: " + err.message);
    }
  };

  // Handle Brand Content Save
  const handleSaveContentSection = async (section, data) => {
    try {
      const res = await api.updateContent(section, data, token);
      if (res.success) {
        showToast(`Updated ${section} details successfully`);
        setSiteContentData(res.data);
      }
    } catch (err) {
      alert("Failed to save content: " + err.message);
    }
  };

  return (
    <div className="manager-layout">
      {/* Toast */}
      {toastMsg && (
        <div className="toast-container">
          <div className="toast-msg">
            <Check size={18} color="#4ade80" />
            <span>{toastMsg}</span>
          </div>
        </div>
      )}

      {/* Manager Topbar */}
      <header className="manager-topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <span className="brand-name" style={{ fontSize: '1.4rem' }}>AROHVI</span>
          <div className="manager-badge">
            Founder & Manager Portal
          </div>
          <span style={{ fontSize: '0.84rem', color: 'var(--color-warm-ivory-dim)' }}>
            Signed in as <strong>{manager?.name || 'Tulsi Prakash'}</strong>
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button 
            className="btn-secondary"
            style={{ padding: '0.55rem 1.1rem', fontSize: '0.78rem' }}
            onClick={() => {
              if (onSwitchToStore) onSwitchToStore();
              navigate('/');
            }}
          >
            <ExternalLink size={14} />
            <span>View Live Store</span>
          </button>

          <button 
            className="btn-secondary"
            style={{ padding: '0.55rem 1rem', fontSize: '0.78rem', color: '#f87171', borderColor: 'rgba(239, 68, 68, 0.4)' }}
            onClick={() => {
              logout();
              navigate('/manager/login');
            }}
          >
            <LogOut size={14} />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="manager-nav-tabs">
        <button 
          className={`manager-tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <LayoutDashboard size={16} />
          <span>Overview & KPIs</span>
        </button>

        <button 
          className={`manager-tab-btn ${activeTab === 'products' ? 'active' : ''}`}
          onClick={() => setActiveTab('products')}
        >
          <Package size={16} />
          <span>Products & Inventory ({productsList.length})</span>
        </button>

        <button 
          className={`manager-tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
          onClick={() => setActiveTab('orders')}
        >
          <ShoppingBag size={16} />
          <span>Orders & Fulfilment ({ordersList.length})</span>
        </button>

        <button 
          className={`manager-tab-btn ${activeTab === 'story' ? 'active' : ''}`}
          onClick={() => setActiveTab('story')}
        >
          <FileText size={16} />
          <span>Founder Story & Banners</span>
        </button>

        <button 
          className={`manager-tab-btn ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          <Settings size={16} />
          <span>Shipping & Policies</span>
        </button>
      </nav>

      {/* Tab Contents */}
      <div className="manager-content-area">
        {/* TAB 1: OVERVIEW & KPIS */}
        {activeTab === 'overview' && analytics && (
          <div>
            <div className="kpi-cards-grid">
              <div className="kpi-card">
                <div className="kpi-title">Total Revenue</div>
                <div className="kpi-value">₹{analytics.totalRevenue.toLocaleString('en-IN')}</div>
                <div className="kpi-subtitle">Across all active customer orders</div>
              </div>

              <div className="kpi-card">
                <div className="kpi-title">Total Orders</div>
                <div className="kpi-value">{analytics.totalOrders}</div>
                <div className="kpi-subtitle">Average Order Value: ₹{analytics.averageOrderValue}</div>
              </div>

              <div className="kpi-card">
                <div className="kpi-title">Active Adornments</div>
                <div className="kpi-value">{analytics.totalProducts}</div>
                <div className="kpi-subtitle">Curated catalog pieces</div>
              </div>

              <div className="kpi-card">
                <div className="kpi-title">Low Stock Alert</div>
                <div className="kpi-value" style={{ color: analytics.lowStockCount > 0 ? '#f87171' : 'var(--color-warm-ivory)' }}>
                  {analytics.lowStockCount}
                </div>
                <div className="kpi-subtitle">Pieces with under 5 units remaining</div>
              </div>
            </div>

            {/* Quick Recent Orders */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '2rem' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.4rem', color: 'var(--color-warm-ivory)' }}>
                    Recent Orders
                  </h3>
                  <button 
                    className="btn-secondary" 
                    style={{ fontSize: '0.74rem', padding: '0.4rem 0.8rem' }}
                    onClick={() => setActiveTab('orders')}
                  >
                    View All Orders →
                  </button>
                </div>

                <div className="manager-table-wrapper">
                  <table className="manager-table">
                    <thead>
                      <tr>
                        <th>Order #</th>
                        <th>Customer</th>
                        <th>Amount</th>
                        <th>Status</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analytics.recentOrders && analytics.recentOrders.length > 0 ? (
                        analytics.recentOrders.map((ord) => (
                          <tr key={ord.id}>
                            <td><strong>{ord.order_number}</strong></td>
                            <td>{ord.customer_name}</td>
                            <td>₹{ord.total_amount}</td>
                            <td>
                              <span className={`status-badge ${ord.order_status.toLowerCase()}`}>
                                {ord.order_status}
                              </span>
                            </td>
                            <td style={{ fontSize: '0.78rem', color: 'var(--color-warm-ivory-dim)' }}>
                              {new Date(ord.created_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="5" style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--color-warm-ivory-dim)' }}>
                            <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.1rem', color: 'var(--color-warm-ivory)', marginBottom: '0.3rem' }}>
                              No orders placed yet
                            </div>
                            <div style={{ fontSize: '0.8rem' }}>
                              Live customer purchases will appear here automatically.
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Low Stock Watch */}
              <div>
                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.4rem', color: 'var(--color-warm-ivory)', marginBottom: '1rem' }}>
                  Inventory Watch
                </h3>
                <div style={{ backgroundColor: 'var(--color-charcoal-secondary)', border: '1px solid var(--color-subtle-border)', borderRadius: '4px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {analytics.lowStockProducts?.length === 0 ? (
                    <div style={{ color: '#4ade80', fontSize: '0.88rem' }}>
                      ✓ All product inventory levels are healthy.
                    </div>
                  ) : (
                    analytics.lowStockProducts?.map((item) => (
                      <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.8rem', borderBottom: '1px solid rgba(57, 49, 45, 0.4)' }}>
                        <div>
                          <div style={{ color: 'var(--color-warm-ivory)', fontWeight: 600, fontSize: '0.9rem' }}>{item.name}</div>
                          <div style={{ fontSize: '0.76rem', color: '#f87171' }}>Only {item.stock} left in stock</div>
                        </div>
                        <button 
                          className="btn-secondary" 
                          style={{ fontSize: '0.74rem', padding: '0.35rem 0.75rem' }}
                          onClick={() => openEditProductModal(item)}
                        >
                          Restock
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: PRODUCTS & INVENTORY */}
        {activeTab === 'products' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div>
                <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.8rem', color: 'var(--color-warm-ivory)' }}>
                  Product Catalogue Management
                </h2>
                <p style={{ fontSize: '0.86rem', color: 'var(--color-warm-ivory-dim)' }}>
                  Add, update prices (₹100–₹800), edit photography, stories, and manage real-time inventory.
                </p>
              </div>

              <button 
                className="btn-primary"
                onClick={openAddProductModal}
              >
                <Plus size={16} />
                <span>Add New Piece</span>
              </button>
            </div>

            <div className="manager-table-wrapper">
              <table className="manager-table">
                <thead>
                  <tr>
                    <th>Piece</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Stock</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {productsList.map((prod) => (
                    <tr key={prod.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
                          <img 
                            src={prod.image_url} 
                            alt={prod.name} 
                            style={{ width: '48px', height: '48px', borderRadius: '2px', objectFit: 'cover' }} 
                          />
                          <div>
                            <div style={{ fontWeight: 600 }}>{prod.name}</div>
                            <div style={{ fontSize: '0.76rem', color: 'var(--color-muted-champagne)' }}>
                              {prod.material}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>{prod.category}</td>
                      <td>
                        <strong>₹{prod.price}</strong>
                        {prod.original_price && (
                          <span style={{ fontSize: '0.78rem', color: '#7A6F68', textDecoration: 'line-through', marginLeft: '0.4rem' }}>
                            ₹{prod.original_price}
                          </span>
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <button
                            className="icon-btn"
                            style={{ width: '24px', height: '24px', fontSize: '0.8rem', border: '1px solid var(--color-subtle-border)' }}
                            onClick={() => handleQuickStockChange(prod, -1)}
                            title="Decrease stock by 1"
                            disabled={prod.stock <= 0}
                          >
                            -
                          </button>
                          <span style={{ color: prod.stock < 5 ? '#f87171' : 'var(--color-warm-ivory)', fontWeight: 600, minWidth: '32px', textAlign: 'center', fontSize: '0.88rem' }}>
                            {prod.stock}
                          </span>
                          <button
                            className="icon-btn"
                            style={{ width: '24px', height: '24px', fontSize: '0.8rem', border: '1px solid var(--color-subtle-border)' }}
                            onClick={() => handleQuickStockChange(prod, 1)}
                            title="Increase stock by 1"
                          >
                            +
                          </button>
                          <button
                            className="btn-secondary"
                            style={{ padding: '0.2rem 0.45rem', fontSize: '0.68rem', marginLeft: '0.25rem' }}
                            onClick={() => handleQuickStockChange(prod, 5)}
                            title="Quick restock +5 units"
                          >
                            +5
                          </button>
                        </div>
                      </td>
                      <td>
                        <span className={`status-badge ${prod.stock > 0 ? 'confirmed' : 'cancelled'}`}>
                          {prod.stock > 0 ? 'In Stock' : 'Out of Stock'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.6rem' }}>
                          <button 
                            className="icon-btn"
                            onClick={() => openEditProductModal(prod)}
                            title="Edit Piece"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            className="icon-btn"
                            style={{ color: '#f87171' }}
                            onClick={() => handleDeleteProduct(prod.id, prod.name)}
                            title="Delete Piece"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: ORDERS & FULFILMENT */}
        {activeTab === 'orders' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.8rem', color: 'var(--color-warm-ivory)' }}>
                  Customer Orders & Fulfilment
                </h2>
                <p style={{ fontSize: '0.86rem', color: 'var(--color-warm-ivory-dim)' }}>
                  Manage status transitions and assign express courier tracking numbers.
                </p>
              </div>

              {/* Status Filter Tabs */}
              <div className="category-pills">
                {['All', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled'].map((st) => (
                  <button
                    key={st}
                    className={`category-pill ${orderFilter.toLowerCase() === st.toLowerCase() ? 'active' : ''}`}
                    onClick={() => setOrderFilter(st)}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            <div className="manager-table-wrapper">
              <table className="manager-table">
                <thead>
                  <tr>
                    <th>Order #</th>
                    <th>Customer & Shipping</th>
                    <th>Items Ordered</th>
                    <th>Total (INR)</th>
                    <th>Payment</th>
                    <th>Fulfillment Status</th>
                    <th>Courier Tracking</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {ordersList
                    .filter(o => orderFilter === 'All' || orderFilter === 'all' || o.order_status.toLowerCase() === orderFilter.toLowerCase())
                    .length === 0 ? (
                      <tr>
                        <td colSpan="8" style={{ textAlign: 'center', padding: '3.5rem 1rem', color: 'var(--color-warm-ivory-dim)' }}>
                          <ShoppingBag size={40} strokeWidth={1} style={{ margin: '0 auto 0.8rem', opacity: 0.35, color: 'var(--color-muted-champagne)' }} />
                          <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.3rem', color: 'var(--color-warm-ivory)', marginBottom: '0.4rem' }}>
                            No orders found
                          </div>
                          <div style={{ fontSize: '0.84rem' }}>
                            {orderFilter === 'All' || orderFilter === 'all' 
                              ? 'Your store is ready for launch! Customer purchases will be listed here automatically in real time.'
                              : `No orders currently marked as '${orderFilter}'.`}
                          </div>
                        </td>
                      </tr>
                    ) : (
                      ordersList
                        .filter(o => orderFilter === 'All' || orderFilter === 'all' || o.order_status.toLowerCase() === orderFilter.toLowerCase())
                        .map((ord) => (
                          <tr key={ord.id}>
                            <td>
                              <strong>{ord.order_number}</strong>
                              <div style={{ fontSize: '0.74rem', color: 'var(--color-warm-ivory-dim)' }}>
                                {new Date(ord.created_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </td>
                            <td>
                              <div><strong>{ord.customer_name}</strong></div>
                              <div style={{ fontSize: '0.78rem', color: 'var(--color-warm-ivory-dim)' }}>{ord.customer_phone}</div>
                              <div style={{ fontSize: '0.76rem', color: 'var(--color-muted-champagne)' }}>{ord.shipping_address}, {ord.city} ({ord.pincode})</div>
                            </td>
                            <td>
                              {ord.items?.map((it, i) => (
                                <div key={i} style={{ fontSize: '0.82rem' }}>
                                  {it.quantity}x {it.name}
                                </div>
                              ))}
                            </td>
                            <td>
                              <strong>₹{ord.total_amount}</strong>
                            </td>
                            <td>
                              <div style={{ fontSize: '0.82rem' }}>{ord.payment_method}</div>
                              <span className={`status-badge ${ord.payment_status.toLowerCase()}`} style={{ marginTop: '0.3rem' }}>
                                {ord.payment_status}
                              </span>
                            </td>
                            <td>
                              <span className={`status-badge ${ord.order_status.toLowerCase()}`}>
                                {ord.order_status}
                              </span>
                            </td>
                            <td>
                              {ord.tracking_number ? (
                                <span style={{ fontSize: '0.82rem', color: 'var(--color-muted-champagne)' }}>
                                  {ord.tracking_number}
                                </span>
                              ) : (
                                <span style={{ fontSize: '0.78rem', color: '#7A6F68' }}>Not assigned</span>
                              )}
                            </td>
                            <td>
                              <button 
                                className="btn-secondary"
                                style={{ padding: '0.4rem 0.8rem', fontSize: '0.74rem' }}
                                onClick={() => setStatusUpdateModal({
                                  open: true,
                                  order: ord,
                                  status: ord.order_status,
                                  tracking_number: ord.tracking_number || ''
                                })}
                              >
                                Update
                              </button>
                            </td>
                          </tr>
                        ))
                    )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: FOUNDER STORY & BANNERS */}
        {activeTab === 'story' && siteContentData && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
            {/* Announcement Banner */}
            <div style={{ backgroundColor: 'var(--color-charcoal-secondary)', border: '1px solid var(--color-subtle-border)', borderRadius: '4px', padding: '2rem' }}>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.4rem', color: 'var(--color-warm-ivory)', marginBottom: '1.2rem' }}>
                Store Announcement Bar
              </h3>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">Announcement Text</label>
                <input 
                  type="text" 
                  className="form-control"
                  value={siteContentData.announcement?.text || ''}
                  onChange={(e) => setSiteContentData({
                    ...siteContentData,
                    announcement: { ...siteContentData.announcement, text: e.target.value }
                  })}
                />
              </div>
              <button 
                className="btn-primary" 
                style={{ padding: '0.65rem 1.4rem', fontSize: '0.82rem' }}
                onClick={() => handleSaveContentSection('announcement', siteContentData.announcement)}
              >
                <Save size={14} /> Save Announcement
              </button>
            </div>

            {/* Hero Copy */}
            <div style={{ backgroundColor: 'var(--color-charcoal-secondary)', border: '1px solid var(--color-subtle-border)', borderRadius: '4px', padding: '2rem' }}>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.4rem', color: 'var(--color-warm-ivory)', marginBottom: '1.2rem' }}>
                Homepage Hero Messaging
              </h3>
              <div className="checkout-form-grid" style={{ marginBottom: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Tagline Badge</label>
                  <input 
                    type="text" 
                    className="form-control"
                    value={siteContentData.hero?.badge || ''}
                    onChange={(e) => setSiteContentData({
                      ...siteContentData,
                      hero: { ...siteContentData.hero, badge: e.target.value }
                    })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Primary Headline</label>
                  <input 
                    type="text" 
                    className="form-control"
                    value={siteContentData.hero?.headline || ''}
                    onChange={(e) => setSiteContentData({
                      ...siteContentData,
                      hero: { ...siteContentData.hero, headline: e.target.value }
                    })}
                  />
                </div>
              </div>
              <div className="form-group" style={{ marginBottom: '1.2rem' }}>
                <label className="form-label">Subheadline / Philosophy Statement</label>
                <textarea 
                  rows={3}
                  className="form-control"
                  value={siteContentData.hero?.subheadline || ''}
                  onChange={(e) => setSiteContentData({
                    ...siteContentData,
                    hero: { ...siteContentData.hero, subheadline: e.target.value }
                  })}
                />
              </div>
              <button 
                className="btn-primary" 
                style={{ padding: '0.65rem 1.4rem', fontSize: '0.82rem' }}
                onClick={() => handleSaveContentSection('hero', siteContentData.hero)}
              >
                <Save size={14} /> Save Hero Content
              </button>
            </div>

            {/* Tulsi Prakash Founder Story */}
            <div style={{ backgroundColor: 'var(--color-charcoal-secondary)', border: '1px solid var(--color-subtle-border)', borderRadius: '4px', padding: '2rem' }}>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.4rem', color: 'var(--color-warm-ivory)', marginBottom: '1.2rem' }}>
                Founder Story & Manifesto (Tulsi Prakash)
              </h3>
              <div className="checkout-form-grid" style={{ marginBottom: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Founder Name</label>
                  <input 
                    type="text" 
                    className="form-control"
                    value={siteContentData.founderStory?.founderName || ''}
                    onChange={(e) => setSiteContentData({
                      ...siteContentData,
                      founderStory: { ...siteContentData.founderStory, founderName: e.target.value }
                    })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Role / Title</label>
                  <input 
                    type="text" 
                    className="form-control"
                    value={siteContentData.founderStory?.role || ''}
                    onChange={(e) => setSiteContentData({
                      ...siteContentData,
                      founderStory: { ...siteContentData.founderStory, role: e.target.value }
                    })}
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">Brand Quote</label>
                <input 
                  type="text" 
                  className="form-control"
                  value={siteContentData.founderStory?.quote || ''}
                  onChange={(e) => setSiteContentData({
                    ...siteContentData,
                    founderStory: { ...siteContentData.founderStory, quote: e.target.value }
                  })}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '1.2rem' }}>
                <label className="form-label">Founder Manifesto Narrative</label>
                <textarea 
                  rows={6}
                  className="form-control"
                  value={Array.isArray(siteContentData.founderStory?.paragraphs) ? siteContentData.founderStory.paragraphs.join('\n\n') : ''}
                  onChange={(e) => setSiteContentData({
                    ...siteContentData,
                    founderStory: { ...siteContentData.founderStory, paragraphs: e.target.value.split('\n\n') }
                  })}
                />
              </div>

              <button 
                className="btn-primary" 
                style={{ padding: '0.65rem 1.4rem', fontSize: '0.82rem' }}
                onClick={() => handleSaveContentSection('founderStory', siteContentData.founderStory)}
              >
                <Save size={14} /> Save Founder Story
              </button>
            </div>
          </div>
        )}

        {/* TAB 5: SHIPPING & POLICIES */}
        {activeTab === 'settings' && siteContentData && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={{ backgroundColor: 'var(--color-charcoal-secondary)', border: '1px solid var(--color-subtle-border)', borderRadius: '4px', padding: '2rem' }}>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.4rem', color: 'var(--color-warm-ivory)', marginBottom: '1.2rem' }}>
                Pan-India Shipping Rules
              </h3>
              <div className="checkout-form-grid" style={{ marginBottom: '1.2rem' }}>
                <div className="form-group">
                  <label className="form-label">Free Shipping Minimum Threshold (INR)</label>
                  <input 
                    type="number" 
                    className="form-control"
                    value={siteContentData.settings?.freeShippingThreshold || 499}
                    onChange={(e) => setSiteContentData({
                      ...siteContentData,
                      settings: { ...siteContentData.settings, freeShippingThreshold: Number(e.target.value) }
                    })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Standard Shipping Charge (INR)</label>
                  <input 
                    type="number" 
                    className="form-control"
                    value={siteContentData.settings?.standardShippingFee || 49}
                    onChange={(e) => setSiteContentData({
                      ...siteContentData,
                      settings: { ...siteContentData.settings, standardShippingFee: Number(e.target.value) }
                    })}
                  />
                </div>
              </div>

              <div className="checkout-form-grid" style={{ marginBottom: '1.5rem' }}>
                <div className="form-group">
                  <label className="form-label">Support Email</label>
                  <input 
                    type="email" 
                    className="form-control"
                    value={siteContentData.settings?.supportEmail || 'care@arohvi.in'}
                    onChange={(e) => setSiteContentData({
                      ...siteContentData,
                      settings: { ...siteContentData.settings, supportEmail: e.target.value }
                    })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Studio WhatsApp / Phone</label>
                  <input 
                    type="text" 
                    className="form-control"
                    value={siteContentData.settings?.supportPhone || '+91 98201 45892'}
                    onChange={(e) => setSiteContentData({
                      ...siteContentData,
                      settings: { ...siteContentData.settings, supportPhone: e.target.value }
                    })}
                  />
                </div>
              </div>

              <button 
                className="btn-primary" 
                style={{ padding: '0.65rem 1.4rem', fontSize: '0.82rem' }}
                onClick={() => handleSaveContentSection('settings', siteContentData.settings)}
              >
                <Save size={14} /> Save Store Settings
              </button>
            </div>
          </div>
        )}
      </div>

      {/* PRODUCT ADD / EDIT MODAL */}
      {isProductModalOpen && (
        <div 
          className="modal-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsProductModalOpen(false);
          }}
        >
          <div className="checkout-modal-card" style={{ maxWidth: '780px' }}>
            <div className="reveal-panel-header">
              <span style={{ fontSize: '0.88rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--color-warm-ivory)', fontWeight: 600 }}>
                {editingProduct ? `Edit Adornment: ${editingProduct.name}` : 'Create New Adornment Piece'}
              </span>
              <button 
                className="reveal-close-btn"
                onClick={() => setIsProductModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} style={{ padding: '2rem 2.5rem' }}>
              <div className="checkout-form-grid" style={{ marginBottom: '1.2rem' }}>
                <div className="form-group">
                  <label className="form-label">Piece Name *</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={productForm.name} 
                    onChange={(e) => setProductForm({ ...productForm, name: e.target.value })} 
                    placeholder="e.g. Chandra Hasli Choker" 
                    required 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Category *</label>
                  <select 
                    className="form-control"
                    value={productForm.category}
                    onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                  >
                    <option value="Rings">Rings</option>
                    <option value="Earrings">Earrings</option>
                    <option value="Cuffs & Kadas">Cuffs & Kadas</option>
                    <option value="Necklaces & Haslis">Necklaces & Haslis</option>
                  </select>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '1.2rem' }}>
                <label className="form-label">Poetic Tagline</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={productForm.tagline} 
                  onChange={(e) => setProductForm({ ...productForm, tagline: e.target.value })} 
                  placeholder="e.g. Volcanic contours forged for everyday rebellion" 
                />
              </div>

              <div className="checkout-form-grid" style={{ marginBottom: '1.2rem' }}>
                <div className="form-group">
                  <label className="form-label">Price in INR (₹100–₹800 range) *</label>
                  <input 
                    type="number" 
                    className="form-control" 
                    value={productForm.price} 
                    onChange={(e) => setProductForm({ ...productForm, price: e.target.value })} 
                    placeholder="e.g. 499" 
                    required 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Original Price / MRP (INR)</label>
                  <input 
                    type="number" 
                    className="form-control" 
                    value={productForm.original_price} 
                    onChange={(e) => setProductForm({ ...productForm, original_price: e.target.value })} 
                    placeholder="e.g. 650" 
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '1.4rem' }}>
                <label className="form-label">Initial Stock Available *</label>
                <input 
                  type="number" 
                  className="form-control" 
                  value={productForm.stock} 
                  onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })} 
                  style={{ maxWidth: '240px' }}
                  required 
                />
              </div>

              {/* CLOUDINARY MULTI-IMAGE UPLOAD & GALLERY SECTION */}
              <div style={{ backgroundColor: 'var(--color-obsidian)', border: '1px solid var(--color-subtle-border)', borderRadius: '4px', padding: '1.4rem', marginBottom: '1.4rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Cloud size={17} color="var(--color-muted-champagne)" />
                    <span style={{ fontSize: '0.82rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-warm-ivory)', fontWeight: 600 }}>
                      Product Gallery & Cloudinary Storage
                    </span>
                  </div>
                  <span style={{ fontSize: '0.74rem', color: 'var(--color-muted-champagne)' }}>
                    {productForm.gallery?.length || 0} photo(s) in gallery
                  </span>
                </div>

                {uploadError && (
                  <div style={{ backgroundColor: 'rgba(140, 38, 53, 0.25)', border: '1px solid var(--color-ruby-red)', padding: '0.6rem 0.9rem', borderRadius: '3px', color: '#f87171', fontSize: '0.82rem', marginBottom: '0.8rem' }}>
                    {uploadError}
                  </div>
                )}

                {/* Drag & Drop / File Input Box */}
                <label 
                  htmlFor="cloudinary-multi-upload"
                  className={`upload-dropzone ${isUploading ? 'dragging' : ''}`}
                  style={{ display: 'block' }}
                >
                  <input 
                    type="file"
                    id="cloudinary-multi-upload"
                    multiple
                    accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
                    onChange={handleMultipleFilesUpload}
                    disabled={isUploading}
                    style={{ display: 'none' }}
                  />

                  {isUploading ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', color: 'var(--color-muted-champagne)' }}>
                      <RefreshCw size={24} className="spin" style={{ animation: 'spin 1s linear infinite' }} />
                      <span style={{ fontSize: '0.86rem', fontWeight: 600 }}>Uploading image(s) to Cloudinary CDN...</span>
                      <span style={{ fontSize: '0.74rem', color: 'var(--color-warm-ivory-dim)' }}>Compressing and generating responsive formats</span>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem' }}>
                      <Upload size={24} color="var(--color-muted-champagne)" />
                      <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--color-warm-ivory)' }}>
                        Click to Upload Multiple Photos to Cloudinary
                      </div>
                      <div style={{ fontSize: '0.76rem', color: 'var(--color-warm-ivory-dim)' }}>
                        Select 1 or more images (JPEG, PNG, WEBP, AVIF · Max 10MB each)
                      </div>
                    </div>
                  )}
                </label>

                {/* Alternative: Add Image URL or Sample Preset */}
                <div style={{ display: 'flex', gap: '0.6rem', marginTop: '1rem', flexWrap: 'wrap' }}>
                  <input 
                    type="text"
                    placeholder="Or paste external Cloudinary / HTTPS image URL..."
                    className="form-control"
                    style={{ flexGrow: 1, minWidth: '220px', fontSize: '0.82rem', padding: '0.5rem 0.8rem' }}
                    value={customImageUrl}
                    onChange={(e) => setCustomImageUrl(e.target.value)}
                  />
                  <button 
                    type="button"
                    className="btn-secondary"
                    style={{ padding: '0.5rem 1rem', fontSize: '0.76rem' }}
                    onClick={handleAddManualUrl}
                  >
                    Add URL
                  </button>

                  <select 
                    className="select-dropdown"
                    style={{ fontSize: '0.76rem', padding: '0.5rem 0.8rem' }}
                    onChange={(e) => {
                      if (e.target.value) {
                        setProductForm(prev => {
                          const updated = [...(prev.gallery || []), e.target.value];
                          return { ...prev, gallery: updated, image_url: prev.image_url || e.target.value };
                        });
                        e.target.value = '';
                      }
                    }}
                  >
                    <option value="">+ Add Brand Preset Image</option>
                    <option value="/images/ring_sculptural.jpg">Sculptural Ring Preset</option>
                    <option value="/images/earrings_sculptural.jpg">Architectural Drop Earrings</option>
                    <option value="/images/cuff_bracelet.jpg">Tribal Engraved Cuff</option>
                    <option value="/images/hasli_choker.jpg">Asymmetric Hasli Choker</option>
                    <option value="/images/hero_banner.jpg">Editorial Suite Banner</option>
                  </select>
                </div>

                {/* Gallery Previews Grid */}
                {productForm.gallery && productForm.gallery.length > 0 && (
                  <div style={{ marginTop: '1.2rem' }}>
                    <div style={{ fontSize: '0.74rem', color: 'var(--color-warm-ivory-dim)', marginBottom: '0.6rem' }}>
                      Click <strong>Cover</strong> on any photo to set it as the primary thumbnail:
                    </div>

                    <div className="gallery-grid">
                      {productForm.gallery.map((imgUrl, index) => {
                        const isPrimary = productForm.image_url === imgUrl;
                        return (
                          <div 
                            key={index} 
                            className={`gallery-thumb-card ${isPrimary ? 'is-primary' : ''}`}
                          >
                            <img src={imgUrl} alt={`Product gallery ${index + 1}`} />

                            {isPrimary && (
                              <div className="primary-indicator-badge">
                                <Star size={10} fill="currentColor" /> Cover
                              </div>
                            )}

                            <div className="gallery-thumb-actions">
                              {!isPrimary && (
                                <button 
                                  type="button"
                                  className="gallery-action-btn"
                                  onClick={() => handleSetPrimaryImage(imgUrl)}
                                  title="Set as primary cover photo"
                                >
                                  Cover
                                </button>
                              )}
                              <button 
                                type="button"
                                className="gallery-action-btn"
                                style={{ color: '#f87171' }}
                                onClick={() => handleRemoveGalleryImage(index)}
                                title="Remove photo"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div className="checkout-form-grid" style={{ marginBottom: '1.2rem' }}>
                <div className="form-group">
                  <label className="form-label">Material & Alloy</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={productForm.material} 
                    onChange={(e) => setProductForm({ ...productForm, material: e.target.value })} 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Finish / Patina</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={productForm.finish} 
                    onChange={(e) => setProductForm({ ...productForm, finish: e.target.value })} 
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '1.2rem' }}>
                <label className="form-label">Design Story (The Story Behind the Piece)</label>
                <textarea 
                  rows={3} 
                  className="form-control" 
                  value={productForm.story} 
                  onChange={(e) => setProductForm({ ...productForm, story: e.target.value })} 
                />
              </div>

              <div className="form-group" style={{ marginBottom: '1.8rem' }}>
                <label className="form-label">Styling Tip (Wear It Your Way)</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={productForm.styling_tip} 
                  onChange={(e) => setProductForm({ ...productForm, styling_tip: e.target.value })} 
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                <button 
                  type="button" 
                  className="btn-secondary" 
                  onClick={() => setIsProductModalOpen(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-primary"
                >
                  <Save size={15} /> Save Piece
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ORDER STATUS UPDATE MODAL */}
      {statusUpdateModal.open && statusUpdateModal.order && (
        <div 
          className="modal-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) setStatusUpdateModal({ open: false, order: null, status: '', tracking_number: '' });
          }}
        >
          <div className="checkout-modal-card" style={{ maxWidth: '500px' }}>
            <div className="reveal-panel-header">
              <span style={{ fontSize: '0.88rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--color-warm-ivory)', fontWeight: 600 }}>
                Update Order #{statusUpdateModal.order.order_number}
              </span>
              <button 
                className="reveal-close-btn"
                onClick={() => setStatusUpdateModal({ open: false, order: null, status: '', tracking_number: '' })}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleUpdateOrderStatus} style={{ padding: '2rem' }}>
              <div className="form-group" style={{ marginBottom: '1.2rem' }}>
                <label className="form-label">Fulfillment Status</label>
                <select 
                  className="form-control"
                  value={statusUpdateModal.status}
                  onChange={(e) => setStatusUpdateModal({ ...statusUpdateModal, status: e.target.value })}
                >
                  <option value="Confirmed">Confirmed</option>
                  <option value="Shipped">Shipped (In Transit)</option>
                  <option value="Delivered">Delivered</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: '1.8rem' }}>
                <label className="form-label">Courier Tracking AWB Number</label>
                <input 
                  type="text" 
                  className="form-control"
                  placeholder="e.g. DEL9921048821IN"
                  value={statusUpdateModal.tracking_number}
                  onChange={(e) => setStatusUpdateModal({ ...statusUpdateModal, tracking_number: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                <button 
                  type="button" 
                  className="btn-secondary"
                  onClick={() => setStatusUpdateModal({ open: false, order: null, status: '', tracking_number: '' })}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-primary"
                >
                  Update Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
