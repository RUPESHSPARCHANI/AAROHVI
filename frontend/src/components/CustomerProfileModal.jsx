import React, { useState } from 'react';
import { X, User, Package, MapPin, Phone, Mail, LogOut, CheckCircle, Clock, Truck, Save, AlertCircle, ExternalLink } from 'lucide-react';
import { useCustomerAuth } from '../context/CustomerAuthContext';

export const CustomerProfileModal = () => {
  const { 
    customer, 
    isProfileModalOpen, 
    setIsProfileModalOpen, 
    logout, 
    updateProfile,
    customerOrders,
    loadingOrders
  } = useCustomerAuth();

  const [activeTab, setActiveTab] = useState('orders'); // 'orders' | 'profile'
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: customer?.name || '',
    phone: customer?.phone || '',
    shipping_address: customer?.shipping_address || '',
    city: customer?.city || 'Bengaluru',
    state: customer?.state || 'Karnataka',
    pincode: customer?.pincode || '560001'
  });

  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isProfileModalOpen || !customer) return null;

  const handleClose = () => {
    setIsProfileModalOpen(false);
    setIsEditing(false);
    setSuccessMsg('');
    setErrorMsg('');
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg('');
    setErrorMsg('');

    const res = await updateProfile(formData);
    setSaving(false);

    if (res.success) {
      setSuccessMsg('Your profile and address have been updated successfully.');
      setIsEditing(false);
    } else {
      setErrorMsg(res.message || 'Failed to update profile.');
    }
  };

  return (
    <div 
      className="modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget && !saving) handleClose();
      }}
    >
      <div 
        className="checkout-modal-card" 
        style={{ 
          maxWidth: '560px',
          backgroundColor: 'var(--color-charcoal-secondary)',
          border: '1px solid var(--color-subtle-border)',
          boxShadow: '0 25px 60px rgba(0,0,0,0.8)'
        }}
      >
        {/* Header */}
        <div className="reveal-panel-header" style={{ padding: '1.25rem 1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: 'var(--color-ruby-red)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-warm-ivory)',
              fontWeight: 600,
              fontSize: '0.85rem'
            }}>
              {customer.name?.charAt(0)?.toUpperCase() || 'A'}
            </div>
            <div>
              <div style={{ fontSize: '0.9rem', color: 'var(--color-warm-ivory)', fontWeight: 600 }}>
                {customer.name}
              </div>
              <div style={{ fontSize: '0.74rem', color: 'var(--color-warm-ivory-dim)' }}>
                {customer.email}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
            <button
              onClick={logout}
              title="Sign Out"
              style={{
                background: 'transparent',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#f87171',
                padding: '0.35rem 0.65rem',
                borderRadius: '2px',
                fontSize: '0.74rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem'
              }}
            >
              <LogOut size={12} />
              <span>Sign Out</span>
            </button>

            <button 
              className="reveal-close-btn"
              onClick={handleClose}
              aria-label="Close profile modal"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr 1fr', 
          borderBottom: '1px solid var(--color-subtle-border)',
          backgroundColor: 'rgba(0,0,0,0.25)'
        }}>
          <button
            type="button"
            onClick={() => { setActiveTab('orders'); setSuccessMsg(''); setErrorMsg(''); }}
            style={{
              padding: '0.85rem 1rem',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'orders' ? '2px solid var(--color-ruby-red)' : '2px solid transparent',
              color: activeTab === 'orders' ? 'var(--color-warm-ivory)' : 'var(--color-warm-ivory-dim)',
              fontSize: '0.82rem',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              fontWeight: activeTab === 'orders' ? 600 : 400,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem'
            }}
          >
            <Package size={14} />
            <span>My Orders ({customerOrders.length})</span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('profile'); setSuccessMsg(''); setErrorMsg(''); }}
            style={{
              padding: '0.85rem 1rem',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'profile' ? '2px solid var(--color-ruby-red)' : '2px solid transparent',
              color: activeTab === 'profile' ? 'var(--color-warm-ivory)' : 'var(--color-warm-ivory-dim)',
              fontSize: '0.82rem',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              fontWeight: activeTab === 'profile' ? 600 : 400,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem'
            }}
          >
            <User size={14} />
            <span>Profile & Address</span>
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '1.5rem', maxHeight: '68vh', overflowY: 'auto' }}>
          {successMsg && (
            <div style={{
              backgroundColor: 'rgba(74, 222, 128, 0.15)',
              border: '1px solid #4ade80',
              padding: '0.7rem 0.9rem',
              borderRadius: '2px',
              color: '#4ade80',
              fontSize: '0.82rem',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <CheckCircle size={15} />
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div style={{
              backgroundColor: 'rgba(140, 38, 53, 0.25)',
              border: '1px solid var(--color-ruby-red)',
              padding: '0.7rem 0.9rem',
              borderRadius: '2px',
              color: '#fca5a5',
              fontSize: '0.82rem',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <AlertCircle size={15} />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* TAB 1: MY ORDERS */}
          {activeTab === 'orders' && (
            <div>
              {loadingOrders ? (
                <div style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--color-warm-ivory-dim)' }}>
                  Loading your adornments history...
                </div>
              ) : customerOrders.length === 0 ? (
                <div style={{ 
                  textAlign: 'center', 
                  padding: '3rem 1.5rem',
                  backgroundColor: 'rgba(0,0,0,0.15)',
                  borderRadius: '4px',
                  border: '1px dashed var(--color-subtle-border)'
                }}>
                  <Package size={36} color="var(--color-muted-champagne)" style={{ opacity: 0.6, marginBottom: '0.75rem' }} />
                  <h4 style={{ fontFamily: 'var(--font-display)', color: 'var(--color-warm-ivory)', marginBottom: '0.4rem', fontSize: '1.1rem' }}>
                    No Orders Yet
                  </h4>
                  <p style={{ fontSize: '0.82rem', color: 'var(--color-warm-ivory-dim)', maxWidth: '320px', margin: '0 auto 1.25rem' }}>
                    When you order handcrafted adornments from AROHVI, your order dispatches and tracking will appear here.
                  </p>
                  <button
                    className="btn-primary"
                    style={{ padding: '0.65rem 1.25rem', fontSize: '0.78rem' }}
                    onClick={handleClose}
                  >
                    Explore Collection
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {customerOrders.map(order => (
                    <div 
                      key={order.id || order.order_number}
                      style={{
                        backgroundColor: 'rgba(0,0,0,0.3)',
                        border: '1px solid var(--color-subtle-border)',
                        borderRadius: '3px',
                        padding: '1.1rem'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                        <div>
                          <span style={{ fontSize: '0.74rem', color: 'var(--color-muted-champagne)', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600 }}>
                            {order.order_number}
                          </span>
                          <div style={{ fontSize: '0.74rem', color: 'var(--color-warm-ivory-dim)', marginTop: '2px' }}>
                            {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                          <span style={{
                            fontSize: '0.68rem',
                            letterSpacing: '0.08em',
                            textTransform: 'uppercase',
                            padding: '0.2rem 0.5rem',
                            borderRadius: '2px',
                            backgroundColor: order.payment_status === 'Paid'
                              ? 'rgba(74, 222, 128, 0.15)'
                              : order.payment_status === 'Failed'
                              ? 'rgba(239, 68, 68, 0.15)'
                              : 'rgba(245, 158, 11, 0.15)',
                            color: order.payment_status === 'Paid'
                              ? '#4ade80'
                              : order.payment_status === 'Failed'
                              ? '#f87171'
                              : '#f59e0b',
                            border: '1px solid currentColor'
                          }}>
                            {order.payment_status || 'Pending'}
                          </span>

                          <span style={{
                            fontSize: '0.68rem',
                            letterSpacing: '0.08em',
                            textTransform: 'uppercase',
                            padding: '0.2rem 0.5rem',
                            borderRadius: '2px',
                            backgroundColor: order.order_status === 'Delivered' 
                              ? 'rgba(74, 222, 128, 0.15)' 
                              : order.order_status === 'Shipped' || order.order_status === 'Out for Delivery'
                              ? 'rgba(96, 165, 250, 0.15)' 
                              : 'rgba(217, 185, 155, 0.15)',
                            color: order.order_status === 'Delivered' 
                              ? '#4ade80' 
                              : order.order_status === 'Shipped' || order.order_status === 'Out for Delivery'
                              ? '#60a5fa' 
                              : 'var(--color-muted-champagne)',
                            border: '1px solid currentColor'
                          }}>
                            {order.order_status || 'Confirmed'}
                          </span>
                        </div>
                      </div>

                      {/* Items list */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '0.75rem' }}>
                        {(order.items || []).map((item, idx) => (
                          <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              {item.image_url && (
                                <img 
                                  src={item.image_url} 
                                  alt={item.name} 
                                  style={{ width: '32px', height: '32px', objectFit: 'cover', borderRadius: '2px' }} 
                                />
                              )}
                              <span style={{ color: 'var(--color-warm-ivory)' }}>
                                {item.name} <span style={{ color: 'var(--color-warm-ivory-dim)' }}>× {item.quantity}</span>
                              </span>
                            </div>
                            <span style={{ color: 'var(--color-muted-champagne)', fontWeight: 500 }}>
                              ₹{(Number(item.price) * Number(item.quantity)).toLocaleString('en-IN')}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Shipping & Delivery Details */}
                      <div style={{
                        marginTop: '0.75rem',
                        padding: '0.65rem 0.8rem',
                        backgroundColor: 'rgba(0,0,0,0.25)',
                        border: '1px solid rgba(255,255,255,0.05)',
                        borderRadius: '2px',
                        fontSize: '0.76rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.35rem'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-warm-ivory-dim)' }}>
                          <span>Deliver To:</span>
                          <span style={{ color: 'var(--color-warm-ivory)', textAlign: 'right' }}>
                            {order.city}, {order.state} ({order.pincode})
                          </span>
                        </div>

                        {(order.courier_name || order.tracking_number) && (
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#60a5fa', paddingTop: '0.3rem', borderTop: '1px dashed rgba(255,255,255,0.07)' }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                              <Truck size={13} />
                              <span>{order.courier_name ? `${order.courier_name}: ` : 'Courier: '}{order.tracking_number}</span>
                            </span>
                            {order.tracking_url && (
                              <a
                                href={order.tracking_url}
                                target="_blank"
                                rel="noreferrer"
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.2rem',
                                  color: 'var(--color-muted-champagne)',
                                  textDecoration: 'underline',
                                  fontSize: '0.74rem'
                                }}
                              >
                                <span>Track Package</span>
                                <ExternalLink size={10} />
                              </a>
                            )}
                          </div>
                        )}

                        {order.estimated_delivery && (
                          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-warm-ivory-dim)' }}>
                            <span>Estimated Delivery:</span>
                            <span style={{ color: 'var(--color-muted-champagne)' }}>{order.estimated_delivery}</span>
                          </div>
                        )}
                      </div>

                      {/* Order Total Footer */}
                      <div style={{ 
                        marginTop: '0.75rem', 
                        paddingTop: '0.65rem', 
                        borderTop: '1px solid rgba(255,255,255,0.06)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: '0.82rem'
                      }}>
                        <span style={{ color: 'var(--color-warm-ivory-dim)' }}>Payment: {order.payment_method}</span>
                        <div style={{ fontWeight: 600, color: 'var(--color-warm-ivory)' }}>
                          Total: <span style={{ color: 'var(--color-muted-champagne)' }}>₹{Number(order.total_amount).toLocaleString('en-IN')}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: PROFILE & ADDRESS */}
          {activeTab === 'profile' && (
            <div>
              {!isEditing ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div style={{
                    backgroundColor: 'rgba(0,0,0,0.2)',
                    padding: '1.25rem',
                    borderRadius: '3px',
                    border: '1px solid var(--color-subtle-border)'
                  }}>
                    <h5 style={{ 
                      fontSize: '0.76rem', 
                      letterSpacing: '0.12em', 
                      textTransform: 'uppercase', 
                      color: 'var(--color-muted-champagne)',
                      marginBottom: '0.75rem'
                    }}>
                      Contact Information
                    </h5>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-warm-ivory)' }}>
                        <User size={14} color="var(--color-warm-ivory-dim)" />
                        <span>{customer.name}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-warm-ivory)' }}>
                        <Mail size={14} color="var(--color-warm-ivory-dim)" />
                        <span>{customer.email}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-warm-ivory)' }}>
                        <Phone size={14} color="var(--color-warm-ivory-dim)" />
                        <span>{customer.phone || 'No phone added yet'}</span>
                      </div>
                    </div>
                  </div>

                  <div style={{
                    backgroundColor: 'rgba(0,0,0,0.2)',
                    padding: '1.25rem',
                    borderRadius: '3px',
                    border: '1px solid var(--color-subtle-border)'
                  }}>
                    <h5 style={{ 
                      fontSize: '0.76rem', 
                      letterSpacing: '0.12em', 
                      textTransform: 'uppercase', 
                      color: 'var(--color-muted-champagne)',
                      marginBottom: '0.75rem'
                    }}>
                      Default Delivery Address
                    </h5>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--color-warm-ivory)', lineHeight: 1.5 }}>
                      <MapPin size={15} color="var(--color-warm-ivory-dim)" style={{ flexShrink: 0, marginTop: '2px' }} />
                      <div>
                        {customer.shipping_address ? (
                          <>
                            <div>{customer.shipping_address}</div>
                            <div style={{ color: 'var(--color-warm-ivory-dim)' }}>
                              {customer.city}, {customer.state} - {customer.pincode}
                            </div>
                          </>
                        ) : (
                          <div style={{ color: 'var(--color-warm-ivory-dim)' }}>
                            No delivery address saved yet. Save an address for 1-click checkout.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    className="btn-secondary"
                    style={{ width: '100%', padding: '0.8rem', fontSize: '0.82rem' }}
                    onClick={() => {
                      setFormData({
                        name: customer.name || '',
                        phone: customer.phone || '',
                        shipping_address: customer.shipping_address || '',
                        city: customer.city || 'Bengaluru',
                        state: customer.state || 'Karnataka',
                        pincode: customer.pincode || '560001'
                      });
                      setIsEditing(true);
                    }}
                  >
                    Edit Profile & Address
                  </button>
                </div>
              ) : (
                /* EDIT FORM */
                <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Full Name</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="form-control"
                      required
                      disabled={saving}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Phone Number</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="form-control"
                      disabled={saving}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Shipping Address</label>
                    <input
                      type="text"
                      placeholder="House / Flat / Street name"
                      value={formData.shipping_address}
                      onChange={(e) => setFormData({ ...formData, shipping_address: e.target.value })}
                      className="form-control"
                      disabled={saving}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div className="form-group">
                      <label className="form-label">City</label>
                      <input
                        type="text"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        className="form-control"
                        disabled={saving}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Pincode</label>
                      <input
                        type="text"
                        value={formData.pincode}
                        onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                        className="form-control"
                        disabled={saving}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                    <button
                      type="button"
                      className="btn-secondary"
                      style={{ flex: 1, padding: '0.8rem', fontSize: '0.82rem' }}
                      onClick={() => setIsEditing(false)}
                      disabled={saving}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn-primary"
                      style={{ flex: 1, padding: '0.8rem', fontSize: '0.82rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
                      disabled={saving}
                    >
                      <Save size={14} />
                      <span>{saving ? 'Saving...' : 'Save Changes'}</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
