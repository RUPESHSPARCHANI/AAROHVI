import React, { useState } from 'react';
import { X, Search, Package, Truck, CheckCircle2, Clock } from 'lucide-react';
import { api } from '../api/client';

export const TrackOrderModal = ({ isOpen, onClose }) => {
  const [orderId, setOrderId] = useState('');
  const [orderData, setOrderData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleTrack = async (e) => {
    e.preventDefault();
    if (!orderId.trim()) return;

    setLoading(true);
    setError('');
    setOrderData(null);

    try {
      const res = await api.getOrder(orderId.trim());
      if (res.success && res.data) {
        setOrderData(res.data);
      } else {
        setError(res.message || 'No order found with this tracking number. Please verify the ID.');
      }
    } catch (err) {
      setError(err.message || 'Unable to connect to tracking server.');
    } finally {
      setLoading(false);
    }
  };

  const getStepIndex = (status) => {
    switch (status) {
      case 'Pending': return 0;
      case 'Confirmed': return 1;
      case 'Shipped': return 2;
      case 'Delivered': return 3;
      default: return 1;
    }
  };

  return (
    <div 
      className="modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="checkout-modal-card" style={{ maxWidth: '620px' }}>
        <div className="reveal-panel-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Truck size={18} color="var(--color-muted-champagne)" />
            <span style={{ fontSize: '0.85rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--color-warm-ivory)', fontWeight: 600 }}>
              Track Your Adornment Delivery
            </span>
          </div>

          <button 
            className="reveal-close-btn"
            onClick={onClose}
            aria-label="Close tracking"
          >
            <X size={18} />
          </button>
        </div>

        <div className="track-order-modal-body">
          <form onSubmit={handleTrack} className="track-order-form">
            <div className="search-input-wrapper" style={{ flexGrow: 1 }}>
              <Search size={16} className="search-icon-pos" />
              <input 
                type="text"
                placeholder="Enter Order Number (e.g. ARH-2026-9041)"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                className="search-input"
                style={{ padding: '0.85rem 1rem 0.85rem 2.5rem', fontSize: '0.9rem' }}
                required
              />
            </div>
            <button 
              type="submit" 
              className="btn-primary" 
              style={{ padding: '0.85rem 1.4rem' }}
              disabled={loading}
            >
              {loading ? 'Searching...' : 'Track'}
            </button>
          </form>

          {error && (
            <div style={{ backgroundColor: 'rgba(140, 38, 53, 0.25)', border: '1px solid var(--color-ruby-red)', padding: '0.8rem 1rem', borderRadius: '4px', color: '#f87171', fontSize: '0.85rem' }}>
              {error}
            </div>
          )}

          {orderData && (
            <div style={{ backgroundColor: 'var(--color-obsidian)', border: '1px solid var(--color-subtle-border)', borderRadius: '4px', padding: '1.25rem', marginTop: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--color-subtle-border)', paddingBottom: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div>
                  <h4 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.4rem', color: 'var(--color-warm-ivory)', wordBreak: 'break-word' }}>
                    Order #{orderData.order_number}
                  </h4>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-warm-ivory-dim)', marginTop: '0.2rem' }}>
                    Placed on {new Date(orderData.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </div>
                </div>
                <span className={`status-badge ${orderData.order_status?.toLowerCase()}`}>
                  {orderData.order_status}
                </span>
              </div>

              {/* Progress Milestones */}
              <div className="track-milestones-grid">
                {['Received', 'Confirmed', 'Dispatched', 'Delivered'].map((step, idx) => {
                  const currentIdx = getStepIndex(orderData.order_status);
                  const isDone = idx <= currentIdx;
                  return (
                    <div key={step}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: isDone ? 'var(--color-ruby-red)' : 'var(--color-charcoal-elevated)', border: `1px solid ${isDone ? 'var(--color-ruby-red)' : 'var(--color-subtle-border)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.5rem', color: isDone ? '#fff' : 'var(--color-warm-ivory-dim)' }}>
                        {isDone ? <CheckCircle2 size={16} /> : idx + 1}
                      </div>
                      <div style={{ fontSize: '0.74rem', color: isDone ? 'var(--color-warm-ivory)' : 'var(--color-warm-ivory-dim)', fontWeight: isDone ? 600 : 400 }}>
                        {step}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Courier Tracking */}
              {orderData.tracking_number ? (
                <div style={{ backgroundColor: 'var(--color-charcoal-elevated)', border: '1px solid var(--color-subtle-border)', padding: '1rem', borderRadius: '4px', marginBottom: '1.5rem', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--color-muted-champagne)', fontWeight: 600 }}>Courier AWB: </span>
                  <span style={{ color: 'var(--color-warm-ivory)' }}>{orderData.tracking_number} (Delhivery / Bluedart)</span>
                </div>
              ) : (
                <div style={{ fontSize: '0.82rem', color: 'var(--color-warm-ivory-dim)', marginBottom: '1.5rem' }}>
                  Your piece is being carefully packaged in our Bangalore studio. Courier tracking number will update once handed over to delivery partners.
                </div>
              )}

              {/* Order Items */}
              <div>
                <div style={{ fontSize: '0.76rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--color-muted-champagne)', marginBottom: '0.6rem' }}>
                  Pieces in this order
                </div>
                {orderData.items && orderData.items.map((it, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.86rem', padding: '0.4rem 0', color: 'var(--color-warm-ivory-dim)' }}>
                    <span>{it.quantity}x {it.name}</span>
                    <span style={{ color: 'var(--color-warm-ivory)' }}>₹{it.price * it.quantity}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
