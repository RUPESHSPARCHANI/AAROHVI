import React, { useState, useEffect } from 'react';
import { X, CheckCircle, ShieldCheck, ArrowRight, Truck, QrCode, CreditCard, Banknote, Landmark, UserCheck, Lock, AlertCircle } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useCustomerAuth } from '../context/CustomerAuthContext';
import { api } from '../api/client';

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export const CheckoutModal = ({ isOpen, onClose, onOrderPlaced }) => {
  const { cartItems, subtotal, shippingFee, total, clearCart } = useCart();
  const { customer, customerToken, openAuthModal, fetchCustomerOrders } = useCustomerAuth();

  const [formData, setFormData] = useState({
    customer_name: customer?.name || '',
    customer_email: customer?.email || '',
    customer_phone: customer?.phone || '',
    shipping_address: customer?.shipping_address || '',
    city: customer?.city || 'Bengaluru',
    state: customer?.state || 'Karnataka',
    pincode: customer?.pincode || '560001',
    delivery_instructions: '',
    payment_method: 'Razorpay Online (UPI, Cards, NetBanking, QR)'
  });

  useEffect(() => {
    if (customer) {
      setFormData(prev => ({
        ...prev,
        customer_name: customer.name || prev.customer_name,
        customer_email: customer.email || prev.customer_email,
        customer_phone: customer.phone || prev.customer_phone,
        shipping_address: customer.shipping_address || prev.shipping_address,
        city: customer.city || prev.city,
        state: customer.state || prev.state,
        pincode: customer.pincode || prev.pincode
      }));
    }
  }, [customer, isOpen]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [confirmedOrder, setConfirmedOrder] = useState(null);

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCheckoutSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!customer || !customerToken) {
      setErrorMsg('Please sign in or create an account before completing checkout.');
      openAuthModal('login');
      return;
    }

    if (!formData.customer_name || !formData.customer_phone || !formData.shipping_address || !formData.pincode) {
      setErrorMsg('Please complete all required shipping and contact details.');
      return;
    }

    if (cartItems.length === 0) {
      setErrorMsg('Your cart is empty.');
      return;
    }

    setIsSubmitting(true);

    try {
      const orderPayload = {
        customer_name: formData.customer_name.trim(),
        customer_email: customer.email, // Always use authenticated customer email
        customer_phone: formData.customer_phone.trim(),
        shipping_address: formData.shipping_address.trim(),
        city: formData.city.trim(),
        state: formData.state.trim(),
        pincode: formData.pincode.trim(),
        delivery_instructions: formData.delivery_instructions.trim(),
        payment_method: formData.payment_method,
        items: cartItems.map(item => ({
          id: item.id,
          product_id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          variant: item.variant,
          image_url: item.image_url
        }))
      };

      // Scenario A: Online Payment via Razorpay
      if (formData.payment_method.startsWith('Razorpay Online')) {
        const scriptLoaded = await loadRazorpayScript();
        if (!scriptLoaded) {
          setErrorMsg('Failed to initialize Razorpay secure checkout. Please check your internet connection.');
          setIsSubmitting(false);
          return;
        }

        const createRes = await api.createPaymentOrder(orderPayload, customerToken);
        if (!createRes.success || !createRes.data) {
          setErrorMsg(createRes.message || 'Unable to initialize online payment.');
          setIsSubmitting(false);
          return;
        }

        const razorpayOrder = createRes.data;

        const options = {
          key: razorpayOrder.key_id,
          amount: razorpayOrder.amount,
          currency: razorpayOrder.currency || 'INR',
          name: 'AROHVI Atelier',
          description: `Handcrafted Adornments · Order #${razorpayOrder.order_number}`,
          order_id: razorpayOrder.razorpay_order_id,
          prefill: {
            name: formData.customer_name,
            email: customer.email,
            contact: formData.customer_phone
          },
          theme: {
            color: '#8C2635'
          },
          handler: async (response) => {
            try {
              const verifyRes = await api.verifyPayment({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
              }, customerToken);

              if (verifyRes.success && verifyRes.data) {
                setConfirmedOrder(verifyRes.data);
                clearCart();
                fetchCustomerOrders();
                if (onOrderPlaced) onOrderPlaced(verifyRes.data);
              } else {
                setErrorMsg(verifyRes.message || 'Payment signature verification failed.');
              }
            } catch (err) {
              setErrorMsg(err.message || 'Server error while verifying payment.');
            } finally {
              setIsSubmitting(false);
            }
          },
          modal: {
            ondismiss: async () => {
              setIsSubmitting(false);
              try {
                await api.recordPaymentFailure({
                  razorpay_order_id: razorpayOrder.razorpay_order_id,
                  reason: 'Customer closed Razorpay checkout window.'
                }, customerToken);
              } catch {
                // silent failure logging
              }
            }
          }
        };

        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', async (failureResponse) => {
          setIsSubmitting(false);
          setErrorMsg(`Payment Failed: ${failureResponse.error?.description || 'Transaction unsuccessful'}`);
          try {
            await api.recordPaymentFailure({
              razorpay_order_id: razorpayOrder.razorpay_order_id,
              razorpay_payment_id: failureResponse.error?.metadata?.payment_id,
              reason: failureResponse.error?.description || 'Payment rejected by bank/gateway'
            }, customerToken);
          } catch {
            // silent
          }
        });

        rzp.open();
        return;
      }

      // Scenario B: Cash on Delivery (COD)
      const res = await api.createOrder(orderPayload, customerToken);
      if (res.success && res.data) {
        setConfirmedOrder(res.data);
        clearCart();
        fetchCustomerOrders();
        if (onOrderPlaced) onOrderPlaced(res.data);
      } else {
        setErrorMsg(res.message || 'Failed to place order. Please try again.');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Server communication error.');
    } finally {
      if (!formData.payment_method.startsWith('Razorpay Online')) {
        setIsSubmitting(false);
      }
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
        <div className="checkout-modal-body">
          {confirmedOrder ? (
            /* Order Placed Success View */
            <div style={{ textAlign: 'center', padding: '1.5rem 1rem' }}>
              <div style={{ 
                width: '64px', 
                height: '64px', 
                borderRadius: '50%', 
                backgroundColor: 'rgba(74, 222, 128, 0.15)', 
                border: '1px solid #4ade80', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                margin: '0 auto 1.5rem' 
              }}>
                <CheckCircle size={36} color="#4ade80" />
              </div>

              <span style={{ fontSize: '0.8rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--color-muted-champagne)', fontWeight: 600 }}>
                Thank You for Adorning the Unordinary
              </span>
              <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(1.5rem, 5.5vw, 2.4rem)', color: 'var(--color-warm-ivory)', margin: '0.5rem 0 0.8rem', wordBreak: 'break-word' }}>
                Order #{confirmedOrder.order_number}
              </h2>

              <p style={{ maxWidth: '540px', margin: '0 auto 1.8rem', color: 'var(--color-warm-ivory-dim)', fontSize: '0.92rem', lineHeight: '1.7' }}>
                Your order is confirmed with our Bengaluru studio. An automated confirmation receipt has been dispatched to <strong>{confirmedOrder.customer_email}</strong>.
              </p>

              {/* Order Quick Summary Card */}
              <div style={{ width: '100%', maxWidth: '500px', margin: '0 auto 2rem', backgroundColor: 'var(--color-obsidian)', border: '1px solid var(--color-subtle-border)', padding: '1.25rem', borderRadius: '4px', textAlign: 'left' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', fontSize: '0.86rem' }}>
                  <span style={{ color: 'var(--color-warm-ivory-dim)' }}>Payment Status:</span>
                  <span style={{ 
                    color: confirmedOrder.payment_status === 'Paid' ? '#4ade80' : '#f59e0b', 
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    fontSize: '0.8rem'
                  }}>
                    {confirmedOrder.payment_status} ({confirmedOrder.payment_method})
                  </span>
                </div>
                {confirmedOrder.razorpay_payment_id && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', fontSize: '0.82rem' }}>
                    <span style={{ color: 'var(--color-warm-ivory-dim)' }}>Razorpay Payment ID:</span>
                    <span style={{ color: 'var(--color-warm-ivory)', fontFamily: 'monospace' }}>{confirmedOrder.razorpay_payment_id}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', fontSize: '0.86rem' }}>
                  <span style={{ color: 'var(--color-warm-ivory-dim)' }}>Estimated Delivery:</span>
                  <span style={{ color: 'var(--color-muted-champagne)', fontWeight: 600 }}>
                    {confirmedOrder.estimated_delivery || '3–5 Working Days'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', fontSize: '0.86rem' }}>
                  <span style={{ color: 'var(--color-warm-ivory-dim)' }}>Shipping Destination:</span>
                  <span style={{ color: 'var(--color-warm-ivory)' }}>{confirmedOrder.city}, {confirmedOrder.pincode}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '0.8rem', borderTop: '1px solid var(--color-subtle-border)', fontSize: '1.15rem', fontWeight: 700 }}>
                  <span style={{ color: 'var(--color-warm-ivory)' }}>Total Amount:</span>
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
          ) : !customer ? (
            /* Authentication Required Screen for Guest Shoppers */
            <div style={{ textAlign: 'center', padding: '2.5rem 1.5rem' }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: 'rgba(140, 38, 53, 0.15)',
                border: '1px solid var(--color-ruby-red)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.5rem'
              }}>
                <Lock size={30} color="var(--color-muted-champagne)" />
              </div>

              <span style={{ fontSize: '0.8rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--color-muted-champagne)', fontWeight: 600 }}>
                Verified Collector Checkout
              </span>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', color: 'var(--color-warm-ivory)', margin: '0.6rem 0 1rem' }}>
                Sign In Required to Complete Order
              </h3>
              <p style={{ maxWidth: '480px', margin: '0 auto 2rem', color: 'var(--color-warm-ivory-dim)', fontSize: '0.92rem', lineHeight: '1.7' }}>
                Guests are welcome to explore and curate items in their cart. To ensure secure Razorpay payments, verified order tracking, and receipt delivery, please sign in or register your AROHVI account.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', maxWidth: '320px', margin: '0 auto' }}>
                <button
                  type="button"
                  className="btn-primary"
                  style={{ width: '100%', padding: '0.9rem' }}
                  onClick={() => openAuthModal('login')}
                >
                  Sign In to Place Order
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  style={{ width: '100%', padding: '0.9rem' }}
                  onClick={() => openAuthModal('register')}
                >
                  Create New Customer Account
                </button>
              </div>
            </div>
          ) : (
            /* Authenticated Checkout Form View */
            <form onSubmit={handleCheckoutSubmit}>
              {errorMsg && (
                <div style={{
                  backgroundColor: 'rgba(140, 38, 53, 0.25)',
                  border: '1px solid var(--color-ruby-red)',
                  padding: '0.85rem 1.2rem',
                  borderRadius: '3px',
                  color: '#f87171',
                  fontSize: '0.85rem',
                  marginBottom: '1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.6rem'
                }}>
                  <AlertCircle size={16} />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="checkout-layout-grid">
                {/* Left Column: Shipping & Contact */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--color-subtle-border)', paddingBottom: '0.5rem' }}>
                    <h4 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.35rem', color: 'var(--color-warm-ivory)', margin: 0 }}>
                      1. Delivery Address & Contact
                    </h4>
                    <span style={{ fontSize: '0.75rem', color: '#4ade80', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <UserCheck size={13} />
                      <span>{customer.name} ({customer.email})</span>
                    </span>
                  </div>

                  <div className="checkout-form-grid" style={{ marginBottom: '1.1rem' }}>
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
                      <label className="form-label">Phone Number (For Delivery SMS & Calls) *</label>
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

                  <div className="form-group" style={{ marginBottom: '1.1rem' }}>
                    <label className="form-label">Street Address / House No / Apartment *</label>
                    <input 
                      type="text" 
                      name="shipping_address" 
                      className="form-control" 
                      value={formData.shipping_address} 
                      onChange={handleChange} 
                      placeholder="Flat 402, Lotus Orchid, 12th Main Road" 
                      required 
                    />
                  </div>

                  <div className="checkout-form-grid" style={{ marginBottom: '1.1rem' }}>
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

                  <div className="checkout-form-grid" style={{ marginBottom: '1.1rem' }}>
                    <div className="form-group">
                      <label className="form-label">PIN Code (India) *</label>
                      <input 
                        type="text" 
                        name="pincode" 
                        className="form-control" 
                        value={formData.pincode} 
                        onChange={handleChange} 
                        placeholder="560038" 
                        required 
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Delivery Instructions (Optional)</label>
                      <input 
                        type="text" 
                        name="delivery_instructions" 
                        className="form-control" 
                        value={formData.delivery_instructions} 
                        onChange={handleChange} 
                        placeholder="e.g. Ring bell / Leave at security" 
                      />
                    </div>
                  </div>

                  <h4 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.35rem', color: 'var(--color-warm-ivory)', margin: '1.5rem 0 1.1rem', borderBottom: '1px solid var(--color-subtle-border)', paddingBottom: '0.5rem' }}>
                    2. Payment Method
                  </h4>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {[
                      { 
                        id: 'Razorpay Online (UPI, Cards, NetBanking, QR)', 
                        label: 'Razorpay Online (UPI, Google Pay, PhonePe, Cards, NetBanking)', 
                        icon: QrCode,
                        badge: 'Instant & Secure'
                      },
                      { 
                        id: 'Cash on Delivery (COD)', 
                        label: 'Cash on Delivery (COD across India)', 
                        icon: Banknote,
                        badge: 'Pay at Doorstep'
                      }
                    ].map((opt) => {
                      const Icon = opt.icon;
                      const isSelected = formData.payment_method === opt.id;
                      return (
                        <label 
                          key={opt.id}
                          className={`checkout-payment-option ${isSelected ? 'selected' : ''}`}
                        >
                          <div className="checkout-payment-left">
                            <input 
                              type="radio" 
                              name="payment_method" 
                              value={opt.id} 
                              checked={isSelected}
                              onChange={handleChange}
                              style={{ accentColor: 'var(--color-ruby-red)' }}
                            />
                            <Icon size={18} color={isSelected ? 'var(--color-muted-champagne)' : 'currentColor'} style={{ flexShrink: 0 }} />
                            <span className="checkout-payment-label">{opt.label}</span>
                          </div>

                          <span className="checkout-payment-badge">
                            {opt.badge}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Right Column: Order Summary */}
                <div className="checkout-summary-box">
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
                      <span>Connecting to Gateway...</span>
                    ) : (
                      <>
                        <span>Pay ₹{total} & Confirm</span>
                        <ArrowRight size={16} />
                      </>
                    )}
                  </button>

                  <div style={{ marginTop: '1.2rem', textAlign: 'center', fontSize: '0.74rem', color: 'var(--color-warm-ivory-dim)' }}>
                    🔒 256-Bit SSL Encrypted Razorpay Checkout (INR)
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
