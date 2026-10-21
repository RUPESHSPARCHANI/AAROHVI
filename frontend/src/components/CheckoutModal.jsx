import React, { useState } from 'react';
import { X, CheckCircle, ShieldCheck, ArrowRight, Truck, QrCode, CreditCard, Banknote, Landmark } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { api } from '../api/client';

export const CheckoutModal = ({ isOpen, onClose, onOrderPlaced }) => {
  const { cartItems, subtotal, shippingFee, total, clearCart } = useCart();

  const [formData, setFormData] = useState({
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    shipping_address: '',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '560001',
    payment_method: 'UPI (Google Pay / PhonePe / QR)',
    notes: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [confirmedOrder, setConfirmedOrder] = useState(null);

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!formData.customer_name || !formData.customer_email || !formData.customer_phone || !formData.shipping_address) {
      setErrorMsg('Please complete all delivery address and contact fields.');
      return;
    }

    setIsSubmitting(true);
    try {
      const orderPayload = {
        ...formData,
        items: cartItems.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          variant: item.variant,
          image_url: item.image_url
        }))
      };

      const res = await api.createOrder(orderPayload);
      if (res.success && res.data) {
        setConfirmedOrder(res.data);
        clearCart();
        if (onOrderPlaced) onOrderPlaced(res.data);
      } else {
        setErrorMsg(res.message || 'Failed to process order. Please try again.');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Server communication error.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      className="modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onClose();
      }}
    >
      <div className="checkout-modal-card">
        {/* Modal Header */}
        <div className="reveal-panel-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <ShieldCheck size={18} color="var(--color-muted-champagne)" />
            <span style={{ fontSize: '0.85rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--color-warm-ivory)', fontWeight: 600 }}>
              {confirmedOrder ? 'Order Confirmed' : 'Express Checkout & Delivery'}
            </span>
          </div>

          <button 
            className="reveal-close-btn"
            onClick={onClose}
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: '2rem 2.5rem' }}>
          {confirmedOrder ? (
            /* Order Placed Success View */
            <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: 'rgba(74, 222, 128, 0.15)', border: '1px solid #4ade80', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                <CheckCircle size={36} color="#4ade80" />
              </div>

              <span style={{ fontSize: '0.8rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--color-muted-champagne)', fontWeight: 600 }}>
                Thank You for Adorning the Unordinary
              </span>
              <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.4rem', color: 'var(--color-warm-ivory)', margin: '0.5rem 0 1rem' }}>
                Order #{confirmedOrder.order_number}
              </h2>

              <p style={{ maxWidth: '540px', margin: '0 auto 2rem', color: 'var(--color-warm-ivory-dim)', fontSize: '0.95rem', lineHeight: '1.7' }}>
                Your order has been safely placed with our Bangalore studio. A confirmation receipt has been dispatched to <strong>{confirmedOrder.customer_email}</strong>.
              </p>

              {/* Order Quick Summary Card */}
              <div style={{ maxWidth: '500px', margin: '0 auto 2.5rem', backgroundColor: 'var(--color-obsidian)', border: '1px solid var(--color-subtle-border)', padding: '1.5rem', borderRadius: '4px', textAlign: 'left' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.8rem', fontSize: '0.88rem' }}>
                  <span style={{ color: 'var(--color-warm-ivory-dim)' }}>Payment Method:</span>
                  <span style={{ color: 'var(--color-warm-ivory)', fontWeight: 600 }}>{confirmedOrder.payment_method}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.8rem', fontSize: '0.88rem' }}>
                  <span style={{ color: 'var(--color-warm-ivory-dim)' }}>Estimated Delivery:</span>
                  <span style={{ color: 'var(--color-muted-champagne)', fontWeight: 600 }}>3–5 Working Days</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.8rem', fontSize: '0.88rem' }}>
                  <span style={{ color: 'var(--color-warm-ivory-dim)' }}>Shipping Destination:</span>
                  <span style={{ color: 'var(--color-warm-ivory)' }}>{confirmedOrder.city}, {confirmedOrder.pincode}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '0.8rem', borderTop: '1px solid var(--color-subtle-border)', fontSize: '1.1rem', fontWeight: 700 }}>
                  <span style={{ color: 'var(--color-warm-ivory)' }}>Total Amount Paid:</span>
                  <span style={{ color: 'var(--color-muted-champagne)' }}>₹{confirmedOrder.total_amount}</span>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
                <button 
                  className="btn-primary"
                  onClick={onClose}
                >
                  Continue Exploring
                </button>
              </div>
            </div>
          ) : (
            /* Checkout Form View */
            <form onSubmit={handleSubmit}>
              {errorMsg && (
                <div style={{ backgroundColor: 'rgba(140, 38, 53, 0.25)', border: '1px solid var(--color-ruby-red)', padding: '0.8rem 1.2rem', borderRadius: '2px', color: '#f87171', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                  {errorMsg}
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '2.5rem' }}>
                {/* Left Column: Shipping & Contact */}
                <div>
                  <h4 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.35rem', color: 'var(--color-warm-ivory)', marginBottom: '1.25rem', borderBottom: '1px solid var(--color-subtle-border)', paddingBottom: '0.5rem' }}>
                    1. Shipping Information
                  </h4>

                  <div className="checkout-form-grid" style={{ marginBottom: '1.2rem' }}>
                    <div className="form-group">
                      <label className="form-label">Full Name *</label>
                      <input 
                        type="text" 
                        name="customer_name" 
                        className="form-control" 
                        value={formData.customer_name} 
                        onChange={handleChange} 
                        placeholder="e.g. Priya Sharma" 
                        required 
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Phone Number *</label>
                      <input 
                        type="tel" 
                        name="customer_phone" 
                        className="form-control" 
                        value={formData.customer_phone} 
                        onChange={handleChange} 
                        placeholder="+91 98765 43210" 
                        required 
                      />
                    </div>
                  </div>

                  <div className="form-group" style={{ marginBottom: '1.2rem' }}>
                    <label className="form-label">Email Address *</label>
                    <input 
                      type="email" 
                      name="customer_email" 
                      className="form-control" 
                      value={formData.customer_email} 
                      onChange={handleChange} 
                      placeholder="priya@example.com" 
                      required 
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: '1.2rem' }}>
                    <label className="form-label">Street Address / House No / Apartment *</label>
                    <input 
                      type="text" 
                      name="shipping_address" 
                      className="form-control" 
                      value={formData.shipping_address} 
                      onChange={handleChange} 
                      placeholder="House/Flat No, Landmark, Street" 
                      required 
                    />
                  </div>

                  <div className="checkout-form-grid" style={{ marginBottom: '1.2rem' }}>
                    <div className="form-group">
                      <label className="form-label">City *</label>
                      <input 
                        type="text" 
                        name="city" 
                        className="form-control" 
                        value={formData.city} 
                        onChange={handleChange} 
                        required 
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">State *</label>
                      <input 
                        type="text" 
                        name="state" 
                        className="form-control" 
                        value={formData.state} 
                        onChange={handleChange} 
                        required 
                      />
                    </div>
                  </div>

                  <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                    <label className="form-label">Pincode *</label>
                    <input 
                      type="text" 
                      name="pincode" 
                      className="form-control" 
                      value={formData.pincode} 
                      onChange={handleChange} 
                      placeholder="e.g. 560038" 
                      required 
                    />
                  </div>

                  <h4 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.35rem', color: 'var(--color-warm-ivory)', marginBottom: '1.25rem', borderBottom: '1px solid var(--color-subtle-border)', paddingBottom: '0.5rem' }}>
                    2. Payment Method (India)
                  </h4>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {[
                      { id: 'UPI (Google Pay / PhonePe / QR)', label: 'UPI / QR Code (Google Pay, PhonePe, Paytm, BHIM)', icon: QrCode },
                      { id: 'Credit / Debit Card', label: 'Credit or Debit Card (Visa, Mastercard, RuPay)', icon: CreditCard },
                      { id: 'Net Banking', label: 'Net Banking (All major Indian banks)', icon: Landmark },
                      { id: 'Cash on Delivery (COD)', label: 'Cash on Delivery (COD across India)', icon: Banknote }
                    ].map((opt) => {
                      const Icon = opt.icon;
                      const isSelected = formData.payment_method === opt.id;
                      return (
                        <label 
                          key={opt.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.9rem',
                            padding: '0.85rem 1rem',
                            backgroundColor: isSelected ? 'var(--color-charcoal-elevated)' : 'var(--color-obsidian)',
                            border: `1px solid ${isSelected ? 'var(--color-muted-champagne)' : 'var(--color-subtle-border)'}`,
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '0.88rem',
                            color: isSelected ? 'var(--color-warm-ivory)' : 'var(--color-warm-ivory-dim)',
                            transition: 'var(--transition-smooth)'
                          }}
                        >
                          <input 
                            type="radio" 
                            name="payment_method" 
                            value={opt.id} 
                            checked={isSelected}
                            onChange={handleChange}
                            style={{ accentColor: 'var(--color-ruby-red)' }}
                          />
                          <Icon size={18} color={isSelected ? 'var(--color-muted-champagne)' : 'currentColor'} />
                          <span>{opt.label}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Right Column: Order Summary */}
                <div style={{ backgroundColor: 'var(--color-obsidian)', border: '1px solid var(--color-subtle-border)', borderRadius: '4px', padding: '1.8rem', height: 'fit-content' }}>
                  <h4 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.35rem', color: 'var(--color-warm-ivory)', marginBottom: '1.25rem' }}>
                    Order Summary ({cartItems.length} items)
                  </h4>

                  <div style={{ maxHeight: '220px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.8rem', marginBottom: '1.5rem', paddingRight: '0.4rem' }}>
                    {cartItems.map((item) => (
                      <div key={item.key} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.86rem' }}>
                        <img src={item.image_url} alt={item.name} style={{ width: '45px', height: '45px', borderRadius: '2px', objectFit: 'cover' }} />
                        <div style={{ flexGrow: 1, minWidth: 0 }}>
                          <div style={{ color: 'var(--color-warm-ivory)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</div>
                          <div style={{ fontSize: '0.74rem', color: 'var(--color-warm-ivory-dim)' }}>Qty: {item.quantity} · {item.variant}</div>
                        </div>
                        <div style={{ color: 'var(--color-muted-champagne)', fontWeight: 600 }}>₹{item.price * item.quantity}</div>
                      </div>
                    ))}
                  </div>

                  <div style={{ borderTop: '1px solid var(--color-subtle-border)', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.88rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-warm-ivory-dim)' }}>
                      <span>Subtotal</span>
                      <span>₹{subtotal}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-warm-ivory-dim)' }}>
                      <span>Shipping Fee (India)</span>
                      <span>{shippingFee === 0 ? <strong style={{ color: '#4ade80' }}>FREE</strong> : `₹${shippingFee}`}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--color-subtle-border)', paddingTop: '0.8rem', fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-warm-ivory)' }}>
                      <span>Total Payable</span>
                      <span style={{ color: 'var(--color-muted-champagne)' }}>₹{total}</span>
                    </div>
                  </div>

                  <button 
                    type="submit"
                    className="btn-primary" 
                    style={{ width: '100%', marginTop: '1.8rem', padding: '1.1rem' }}
                    disabled={isSubmitting || cartItems.length === 0}
                  >
                    {isSubmitting ? (
                      <span>Placing Order...</span>
                    ) : (
                      <>
                        <span>Place Order (₹{total})</span>
                        <ArrowRight size={16} />
                      </>
                    )}
                  </button>

                  <div style={{ marginTop: '1.2rem', textAlign: 'center', fontSize: '0.74rem', color: 'var(--color-warm-ivory-dim)' }}>
                    🔒 256-Bit SSL Encrypted Indian Payment Processing
                  </div>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
