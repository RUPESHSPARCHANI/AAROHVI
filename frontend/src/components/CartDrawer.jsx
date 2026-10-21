import React from 'react';
import { X, Trash2, ArrowRight, ShoppingBag, ShieldCheck } from 'lucide-react';
import { useCart } from '../context/CartContext';

export const CartDrawer = ({ onProceedToCheckout }) => {
  const {
    cartItems,
    isCartOpen,
    setIsCartOpen,
    updateQuantity,
    removeFromCart,
    subtotal,
    shippingFee,
    total,
    isFreeShipping,
    shippingThreshold
  } = useCart();

  if (!isCartOpen) return null;

  const neededForFreeShipping = Math.max(0, shippingThreshold - subtotal);
  const progressPercent = Math.min(100, Math.round((subtotal / shippingThreshold) * 100));

  return (
    <div 
      className="cart-drawer-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) setIsCartOpen(false);
      }}
    >
      <div className="cart-drawer">
        {/* Header */}
        <div className="cart-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <ShoppingBag size={20} color="var(--color-muted-champagne)" />
            <h3 className="cart-title">Your Adornment Bag</h3>
          </div>
          <button 
            className="reveal-close-btn"
            onClick={() => setIsCartOpen(false)}
            aria-label="Close cart"
          >
            <X size={18} />
          </button>
        </div>

        {/* Free Shipping Meter */}
        <div className="cart-shipping-meter">
          <div style={{ fontSize: '0.8rem', color: 'var(--color-warm-ivory)' }}>
            {isFreeShipping ? (
              <span style={{ color: '#4ade80', fontWeight: 600 }}>
                ✨ You've unlocked FREE Express Shipping across India!
              </span>
            ) : (
              <span>
                Add <strong style={{ color: 'var(--color-muted-champagne)' }}>₹{neededForFreeShipping}</strong> more to unlock FREE Express Shipping.
              </span>
            )}
          </div>
          <div className="shipping-meter-bar">
            <div 
              className="shipping-meter-fill"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Items List */}
        <div className="cart-items-list">
          {cartItems.length === 0 ? (
            <div style={{ textAlign: 'center', margin: 'auto 0', color: 'var(--color-warm-ivory-dim)' }}>
              <ShoppingBag size={48} strokeWidth={1} style={{ margin: '0 auto 1rem', opacity: 0.4 }} />
              <p style={{ fontFamily: 'var(--font-serif)', fontSize: '1.4rem', color: 'var(--color-warm-ivory)' }}>Your bag is currently empty.</p>
              <p style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>Explore our sculptural pieces and adorn the unordinary.</p>
            </div>
          ) : (
            cartItems.map((item) => (
              <div key={item.key} className="cart-item-row">
                <div className="cart-item-thumb">
                  <img src={item.image_url} alt={item.name} />
                </div>
                <div className="cart-item-details">
                  <h4 className="cart-item-title">{item.name}</h4>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-muted-champagne)', marginBottom: '0.3rem' }}>
                    {item.variant}
                  </div>
                  <div className="cart-item-price">₹{item.price}</div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.5rem' }}>
                    <div className="qty-control" style={{ transform: 'scale(0.85)', transformOrigin: 'left center' }}>
                      <button 
                        className="qty-btn"
                        onClick={() => updateQuantity(item.key, -1)}
                      >
                        -
                      </button>
                      <span className="qty-display">{item.quantity}</span>
                      <button 
                        className="qty-btn"
                        onClick={() => updateQuantity(item.key, 1)}
                      >
                        +
                      </button>
                    </div>

                    <button 
                      style={{ background: 'none', border: 'none', color: '#8C2635', cursor: 'pointer', padding: '0.3rem' }}
                      onClick={() => removeFromCart(item.key)}
                      title="Remove piece"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Summary & Checkout */}
        {cartItems.length > 0 && (
          <div className="cart-footer">
            <div className="cart-summary-line">
              <span>Subtotal</span>
              <span>₹{subtotal}</span>
            </div>
            <div className="cart-summary-line">
              <span>Pan-India Delivery</span>
              <span>{shippingFee === 0 ? <strong style={{ color: '#4ade80' }}>FREE</strong> : `₹${shippingFee}`}</span>
            </div>
            <div className="cart-total-line">
              <span>Estimated Total</span>
              <span>₹{total}</span>
            </div>

            <button 
              className="btn-primary" 
              style={{ width: '100%', padding: '1rem' }}
              onClick={() => {
                setIsCartOpen(false);
                onProceedToCheckout();
              }}
            >
              <span>Proceed to Checkout</span>
              <ArrowRight size={16} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginTop: '1rem', fontSize: '0.74rem', color: 'var(--color-warm-ivory-dim)' }}>
              <ShieldCheck size={14} color="var(--color-muted-champagne)" />
              <span>Authentic Indian Adornment | Secure Checkout</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
