import React from 'react';
import { Eye } from 'lucide-react';

export const ProductCard = ({ product, onSelectProduct }) => {
  return (
    <div 
      className="product-card"
      onClick={() => onSelectProduct(product)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onSelectProduct(product);
        }
      }}
    >
      <div className="product-image-container">
        <img 
          src={product.image_url} 
          alt={product.name} 
          className="product-image"
          loading="lazy"
        />

        {product.is_bestseller ? (
          <span className="product-badge-flag">Signature</span>
        ) : product.stock < 5 ? (
          <span className="product-badge-flag" style={{ borderColor: 'var(--color-ruby-red)', color: '#f87171' }}>
            Low Stock ({product.stock})
          </span>
        ) : null}

        <button 
          className="product-quick-reveal-btn"
          onClick={(e) => {
            e.stopPropagation();
            onSelectProduct(product);
          }}
        >
          <Eye size={15} /> Reveal Piece
        </button>
      </div>

      <div className="product-info">
        <span className="product-category-text">{product.category}</span>
        <h3 className="product-name">{product.name}</h3>
        {product.tagline && (
          <p className="product-tagline">{product.tagline}</p>
        )}

        <div className="product-pricing-row">
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.45rem' }}>
            <span className="product-price">₹{product.price}</span>
            {product.original_price && (
              <span className="product-original-price">₹{product.original_price}</span>
            )}
          </div>
          <span className="product-stock-status">
            {product.stock > 0 ? 'Available' : 'Sold Out'}
          </span>
        </div>
      </div>
    </div>
  );
};
