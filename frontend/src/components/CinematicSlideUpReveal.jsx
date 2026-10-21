import React, { useState, useEffect } from 'react';
import { X, ShoppingBag, Zap, Shield, Sparkles, Check, Truck, RotateCcw, Heart } from 'lucide-react';
import { useCart } from '../context/CartContext';

export const CinematicSlideUpReveal = ({ product, isOpen, onClose, onBuyNow }) => {
  const { addToCart } = useCart();
  const [activeTab, setActiveTab] = useState('story');
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [addedAnimation, setAddedAnimation] = useState(false);

  useEffect(() => {
    if (product) {
      setActiveImageIndex(0);
      setQuantity(1);
      setActiveTab('story');
      if (product.variants && product.variants.length > 0) {
        setSelectedVariant(product.variants[0].name);
      } else {
        setSelectedVariant('Standard Fit');
      }
    }
  }, [product]);

  // Handle ESC key to dismiss panel smoothly
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !product) return null;

  const images = Array.isArray(product.gallery) && product.gallery.length > 0
    ? product.gallery
    : [product.image_url];

  const handleAdd = () => {
    addToCart(product, quantity, selectedVariant);
    setAddedAnimation(true);
    setTimeout(() => setAddedAnimation(false), 1800);
  };

  const handleBuyNowClick = () => {
    addToCart(product, quantity, selectedVariant);
    onClose();
    if (onBuyNow) onBuyNow();
  };

  return (
    <div 
      className="reveal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label={`${product.name} detail reveal`}
    >
      <div className="reveal-panel-container">
        {/* Pull handle & Sticky Header */}
        <div className="reveal-panel-header">
          <div className="reveal-panel-handle" />
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Sparkles size={16} color="var(--color-muted-champagne)" />
            <span style={{ fontSize: '0.78rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--color-muted-champagne)', fontWeight: 600 }}>
              Adornment Reveal
            </span>
          </div>

          <button 
            className="reveal-close-btn"
            onClick={onClose}
            aria-label="Close product reveal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Panel Body */}
        <div className="reveal-body">
          {/* Left Column: Visual Gallery */}
          <div>
            <div className="reveal-gallery-main">
              <img 
                src={images[activeImageIndex] || product.image_url} 
                alt={product.name} 
              />
              {product.is_bestseller ? (
                <span className="product-badge-flag">Signature Piece</span>
              ) : null}
            </div>

            {/* Thumbnail switcher if multiple images */}
            {images.length > 1 && (
              <div className="reveal-thumbnails">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    className={`reveal-thumb ${activeImageIndex === idx ? 'active' : ''}`}
                    onClick={() => setActiveImageIndex(idx)}
                  >
                    <img src={img} alt={`${product.name} view ${idx + 1}`} />
                  </button>
                ))}
              </div>
            )}

            {/* Trust highlights */}
            <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.82rem', color: 'var(--color-warm-ivory-dim)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Truck size={16} color="var(--color-ruby-red)" />
                <span>Express Pan-India Delivery | 3–5 Business Days</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <RotateCcw size={16} color="var(--color-ruby-red)" />
                <span>7-Day Replacement Guarantee if Damaged in Transit</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Shield size={16} color="var(--color-ruby-red)" />
                <span>Verified Handcrafted Oxidised Finish</span>
              </div>
            </div>
          </div>

          {/* Right Column: Information, Story & Purchase Actions */}
          <div className="reveal-details-pane">
            <span className="reveal-category">{product.category}</span>
            <h2 className="reveal-title">{product.name}</h2>
            {product.tagline && (
              <p className="reveal-tagline">“{product.tagline}”</p>
            )}

            {/* Pricing Section (Transparent INR Pricing ₹100-₹800) */}
            <div className="reveal-price-box">
              <span className="reveal-price-current">₹{product.price}</span>
              {product.original_price && (
                <span className="reveal-price-old">₹{product.original_price}</span>
              )}
              <span className="reveal-tax-note">
                MRP inclusive of all taxes | Stock: {product.stock > 0 ? `${product.stock} available` : 'Out of stock'}
              </span>
            </div>

            {/* Variant / Size Options */}
            {product.variants && product.variants.length > 0 && (
              <div style={{ marginBottom: '1.5rem' }}>
                <label className="spec-item-label" style={{ display: 'block', marginBottom: '0.5rem' }}>
                  Select Sizing / Variant
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {product.variants.map((v) => (
                    <button
                      key={v.id || v.name}
                      className="category-pill"
                      style={{
                        padding: '0.45rem 1rem',
                        fontSize: '0.8rem',
                        borderColor: selectedVariant === v.name ? 'var(--color-muted-champagne)' : 'var(--color-subtle-border)',
                        backgroundColor: selectedVariant === v.name ? 'var(--color-charcoal-elevated)' : 'transparent',
                        color: selectedVariant === v.name ? 'var(--color-muted-champagne)' : 'var(--color-warm-ivory-dim)'
                      }}
                      onClick={() => setSelectedVariant(v.name)}
                    >
                      {v.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Specifications Snapshot */}
            <div className="reveal-spec-grid">
              <div>
                <div className="spec-item-label">Material & Metal</div>
                <div className="spec-item-val">{product.material || "Oxidised Silver Alloy"}</div>
              </div>
              <div>
                <div className="spec-item-label">Finish / Patina</div>
                <div className="spec-item-val">{product.finish || "Antique Charcoal Patina"}</div>
              </div>
              <div>
                <div className="spec-item-label">Dimensions</div>
                <div className="spec-item-val">{product.dimensions || "Free Size / Standard"}</div>
              </div>
              <div>
                <div className="spec-item-label">Origin & Craft</div>
                <div className="spec-item-val">Handcrafted in India</div>
              </div>
            </div>

            {/* Tabbed Editorial Sections */}
            <div className="reveal-tab-buttons">
              <button
                className={`reveal-tab-btn ${activeTab === 'story' ? 'active' : ''}`}
                onClick={() => setActiveTab('story')}
              >
                The Story Behind the Piece
              </button>
              <button
                className={`reveal-tab-btn ${activeTab === 'wear' ? 'active' : ''}`}
                onClick={() => setActiveTab('wear')}
              >
                Wear It Your Way
              </button>
              <button
                className={`reveal-tab-btn ${activeTab === 'care' ? 'active' : ''}`}
                onClick={() => setActiveTab('care')}
              >
                Care Instructions
              </button>
            </div>

            <div className="reveal-tab-content">
              {activeTab === 'story' && (
                <p>{product.story || "Each AROHVI piece is an exploration of contemporary Indian adornment—blending architectural boldness with centuries-old metalcraft traditions."}</p>
              )}
              {activeTab === 'wear' && (
                <p>{product.styling_tip || "Style boldly. Pair with unbuttoned linens, raw silk kurtas, or everyday street silhouettes. Break conventional matching rules."}</p>
              )}
              {activeTab === 'care' && (
                <p>{product.care_instructions || "Store inside an airtight cloth pouch. Keep away from water, perfumes, and sanitizers. Wipe with a clean, dry microfibre cloth after each wear."}</p>
              )}
            </div>

            {/* Purchase CTA Row */}
            <div className="reveal-actions-row">
              <div className="qty-control">
                <button 
                  className="qty-btn"
                  onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  aria-label="Decrease quantity"
                >
                  -
                </button>
                <span className="qty-display">{quantity}</span>
                <button 
                  className="qty-btn"
                  onClick={() => setQuantity(q => Math.min(product.stock || 10, q + 1))}
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>

              <button 
                className="btn-secondary"
                style={{ flex: 1 }}
                onClick={handleAdd}
                disabled={product.stock <= 0}
              >
                {addedAnimation ? (
                  <>
                    <Check size={16} /> Added to Bag
                  </>
                ) : (
                  <>
                    <ShoppingBag size={16} /> Add to Bag
                  </>
                )}
              </button>

              <button 
                className="btn-primary"
                style={{ flex: 1.2 }}
                onClick={handleBuyNowClick}
                disabled={product.stock <= 0}
              >
                <Zap size={16} /> Buy Now
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
