import React from 'react';
import { Sparkles, Shield, Heart, ArrowUp } from 'lucide-react';

export const Footer = ({ onNavigate }) => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="store-footer">
      <div className="footer-container">
        {/* Col 1: Brand & Manifesto */}
        <div>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', letterSpacing: '0.18em', color: 'var(--color-warm-ivory)', marginBottom: '0.4rem' }}>
            AROHVI
          </h3>
          <p style={{ fontSize: '0.82rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--color-muted-champagne)', marginBottom: '1.2rem' }}>
            Adorn the Unordinary
          </p>
          <p style={{ fontSize: '0.88rem', color: 'var(--color-warm-ivory-dim)', lineHeight: '1.7', maxWidth: '380px', marginBottom: '1.5rem' }}>
            A contemporary adornment house founded by Tulsi Prakash. We challenge the notion that Indian jewellery should be locked away for weddings. Expressive statement pieces crafted for your ordinary days.
          </p>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.76rem', color: 'var(--color-muted-champagne)', padding: '0.4rem 0.8rem', backgroundColor: 'var(--color-charcoal-secondary)', border: '1px solid var(--color-subtle-border)', borderRadius: '2px' }}>
            <Sparkles size={14} />
            <span>Dark Indian Maximalism</span>
          </div>
        </div>

        {/* Col 2: Discover Adornments */}
        <div>
          <h4 className="footer-col-title">Adornments</h4>
          <ul className="footer-links-list">
            <li>
              <a href="#catalog" className="footer-link" onClick={() => onNavigate('catalog')}>
                Sculptural Rings
              </a>
            </li>
            <li>
              <a href="#catalog" className="footer-link" onClick={() => onNavigate('catalog')}>
                Architectural Earrings
              </a>
            </li>
            <li>
              <a href="#catalog" className="footer-link" onClick={() => onNavigate('catalog')}>
                Tribal Cuffs & Kadas
              </a>
            </li>
            <li>
              <a href="#catalog" className="footer-link" onClick={() => onNavigate('catalog')}>
                Asymmetric Hasli Chokers
              </a>
            </li>
            <li>
              <a href="#catalog" className="footer-link" onClick={() => onNavigate('catalog')}>
                Everyday Midi Sets
              </a>
            </li>
          </ul>
        </div>

        {/* Col 3: The House */}
        <div>
          <h4 className="footer-col-title">The House</h4>
          <ul className="footer-links-list">
            <li>
              <a href="#story" className="footer-link" onClick={() => onNavigate('story')}>
                Meet Tulsi Prakash
              </a>
            </li>
            <li>
              <a href="#philosophy" className="footer-link" onClick={() => onNavigate('philosophy')}>
                Brand Manifesto
              </a>
            </li>
            <li>
              <a href="#policies" className="footer-link" onClick={() => onNavigate('philosophy')}>
                Care Instructions
              </a>
            </li>
            <li>
              <a href="#policies" className="footer-link" onClick={() => onNavigate('philosophy')}>
                Pan-India Shipping
              </a>
            </li>
            <li>
              <a href="#policies" className="footer-link" onClick={() => onNavigate('philosophy')}>
                7-Day Replacement
              </a>
            </li>
          </ul>
        </div>

        {/* Col 4: Newsletter / Studio Connect */}
        <div>
          <h4 className="footer-col-title">Studio Dispatches</h4>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-warm-ivory-dim)', lineHeight: '1.6', marginBottom: '1.2rem' }}>
            Receive unreleased design notes, sculptural drops, and founder reflections directly from Tulsi.
          </p>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
            <input 
              type="email" 
              placeholder="Your email address"
              className="form-control"
              style={{ padding: '0.65rem 0.9rem', fontSize: '0.85rem' }}
            />
            <button 
              className="btn-primary"
              style={{ padding: '0.65rem 1.1rem', fontSize: '0.78rem' }}
              onClick={() => alert("Thank you for joining AROHVI Dispatches.")}
            >
              Join
            </button>
          </div>
          <div style={{ fontSize: '0.74rem', color: '#7A6F68' }}>
            Bangalore Studio · Express Dispatches Across India
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="footer-bottom-bar">
        <div>
          © {new Date().getFullYear()} AROHVI Adornments. All rights reserved. Founded by Tulsi Prakash.
        </div>
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
          <span>Obsidian Charcoal · Deep Burgundy · Ruby Red · Warm Ivory</span>
          <button 
            onClick={scrollToTop}
            style={{ background: 'transparent', border: '1px solid var(--color-subtle-border)', color: 'var(--color-warm-ivory-dim)', padding: '0.4rem 0.8rem', borderRadius: '2px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.76rem' }}
          >
            <span>Top</span>
            <ArrowUp size={12} />
          </button>
        </div>
      </div>
    </footer>
  );
};
