import React, { useState, useMemo } from 'react';
import { Search, Sparkles, SlidersHorizontal, ArrowDown, Shield, Truck, RefreshCw } from 'lucide-react';
import { ProductCard } from '../../components/ProductCard';

export const UserHome = ({ 
  siteContent, 
  products, 
  onSelectProduct, 
  onNavigateToCatalog,
  onNavigateToStory 
}) => {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('featured');
  const [priceRange, setPriceRange] = useState(800);

  const hero = siteContent?.hero || {};
  const philosophy = siteContent?.philosophy || {};
  const founder = siteContent?.founderStory || {};

  const categories = ['All', 'Rings', 'Earrings', 'Cuffs & Kadas', 'Necklaces & Haslis'];

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      // Category filter
      if (selectedCategory !== 'All') {
        const cat = p.category.toLowerCase();
        const sel = selectedCategory.toLowerCase();
        if (sel.includes('ring') && !cat.includes('ring')) return false;
        if (sel.includes('earring') && !cat.includes('earring')) return false;
        if (sel.includes('cuff') && !cat.includes('cuff') && !cat.includes('kada')) return false;
        if (sel.includes('neck') && !cat.includes('neck') && !cat.includes('hasli')) return false;
      }

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = p.name.toLowerCase().includes(q);
        const matchTag = p.tagline?.toLowerCase().includes(q);
        const matchCat = p.category.toLowerCase().includes(q);
        if (!matchName && !matchTag && !matchCat) return false;
      }

      // Price filter
      if (p.price > priceRange) return false;

      return true;
    }).sort((a, b) => {
      if (sortBy === 'price_asc') return a.price - b.price;
      if (sortBy === 'price_desc') return b.price - a.price;
      if (sortBy === 'bestseller') return (b.is_bestseller || 0) - (a.is_bestseller || 0);
      return 0;
    });
  }, [products, selectedCategory, searchQuery, sortBy, priceRange]);

  return (
    <main>
      {/* 1. Hero Section */}
      <section id="home" className="hero-section">
        <div 
          className="hero-bg-overlay"
          style={{ backgroundImage: `url('/images/hero_banner.jpg')` }}
        />
        <div className="hero-vignette" />

        <div className="hero-content">
          <span className="hero-badge">
            {hero.badge || "Contemporary Indian Adornment"}
          </span>

          <h1 className="hero-title">
            {hero.headline || "Indian Adornment, Reimagined."}
          </h1>

          <p className="hero-subtitle">
            {hero.subheadline || "Challenging the idea that expressive Indian jewellery should be reserved for weddings. Sculptural oxidised statement pieces created for everyday self-expression."}
          </p>

          <div className="hero-cta-group">
            <a 
              href="#catalog" 
              className="btn-primary"
              onClick={(e) => {
                e.preventDefault();
                const el = document.getElementById('catalog');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              <span>{hero.ctaPrimary || "Explore Collection"}</span>
              <ArrowDown size={15} />
            </a>

            <a 
              href="#story" 
              className="btn-secondary"
              onClick={(e) => {
                e.preventDefault();
                const el = document.getElementById('story');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              <span>{hero.ctaSecondary || "Meet Tulsi Prakash"}</span>
            </a>
          </div>
        </div>
      </section>

      {/* 2. Brand Philosophy Strip */}
      <section id="philosophy" className="philosophy-strip">
        <div className="philosophy-container">
          <div className="philosophy-quote-box">
            <p className="philosophy-quote">
              “{philosophy.quote || "Jewellery is not just something you wear for an occasion. It is a way of expressing who you are."}”
            </p>
            <div className="philosophy-author">
              — AROHVI Brand Manifesto · Tulsi Prakash
            </div>
          </div>

          <div className="philosophy-grid">
            <div className="philosophy-card">
              <h3 className="philosophy-card-title">
                {philosophy.statement1_title || "Tradition, Without the Rules"}
              </h3>
              <p className="philosophy-card-desc">
                {philosophy.statement1_desc || "We bring cultural inspiration together with contemporary fashion. Wear expressive pieces to college, work, casual outings, celebrations, and ordinary days."}
              </p>
            </div>

            <div className="philosophy-card">
              <h3 className="philosophy-card-title">
                {philosophy.statement2_title || "Accessible Self-Expression"}
              </h3>
              <p className="philosophy-card-desc">
                {philosophy.statement2_desc || "Everyday luxury shouldn't cost a fortune. Our pieces are thoughtfully priced between ₹100 and ₹800 without compromising on tactile quality or bold design."}
              </p>
            </div>

            <div className="philosophy-card">
              <h3 className="philosophy-card-title">
                {philosophy.statement3_title || "Dark Indian Maximalism"}
              </h3>
              <p className="philosophy-card-desc">
                {philosophy.statement3_desc || "Bold sculptural forms, deep obsidian charcoal, dramatic oxidized silver, and hints of rich ruby burgundy. A tactile, cinematic aesthetic."}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Product Catalog Section */}
      <section id="catalog" className="catalog-section">
        <div className="catalog-header">
          <div>
            <span className="section-eyebrow">The Adornment House</span>
            <h2 className="section-title">Curated Everyday Statement Pieces</h2>
          </div>

          <div className="filter-bar">
            {/* Category Pills */}
            <div className="category-pills">
              {categories.map((cat) => (
                <button
                  key={cat}
                  className={`category-pill ${selectedCategory === cat ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Controls: Search, Price Slider, Sort */}
            <div className="filter-controls">
              <div className="search-input-wrapper">
                <Search size={15} className="search-icon-pos" />
                <input 
                  type="text"
                  placeholder="Search adornments..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input"
                />
              </div>

              {/* Price Filter */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.8rem', color: 'var(--color-warm-ivory-dim)' }}>
                <span>Max: <strong style={{ color: 'var(--color-muted-champagne)' }}>₹{priceRange}</strong></span>
                <input 
                  type="range" 
                  min="250" 
                  max="800" 
                  step="50" 
                  value={priceRange} 
                  onChange={(e) => setPriceRange(Number(e.target.value))}
                  style={{ width: '80px', accentColor: 'var(--color-ruby-red)', cursor: 'pointer' }}
                />
              </div>

              {/* Sort Dropdown */}
              <select 
                className="select-dropdown"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="featured">Featured Pieces</option>
                <option value="bestseller">Signature / Bestsellers</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
              </select>
            </div>
          </div>
        </div>

        {/* Product Cards Grid */}
        {filteredProducts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--color-warm-ivory-dim)' }}>
            <p style={{ fontFamily: 'var(--font-serif)', fontSize: '1.4rem' }}>No pieces matched your selected filter.</p>
            <button 
              className="btn-secondary" 
              style={{ marginTop: '1rem' }}
              onClick={() => {
                setSelectedCategory('All');
                setSearchQuery('');
                setPriceRange(800);
              }}
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="product-grid">
            {filteredProducts.map((product) => (
              <ProductCard 
                key={product.id} 
                product={product} 
                onSelectProduct={onSelectProduct} 
              />
            ))}
          </div>
        )}
      </section>

      {/* 4. Founder Story Section */}
      <section id="story" className="founder-section">
        <div className="founder-container">
          {/* Founder Visual Frame */}
          <div className="founder-image-wrapper">
            <div className="founder-image-frame">
              <img 
                src={founder.image_url || "/images/founder_tulsi.jpg"} 
                alt="Tulsi Prakash - Founder of AROHVI" 
              />
            </div>
            <div className="founder-tag-chip">
              Founder & Designer
            </div>
          </div>

          {/* Founder Story Copy */}
          <div className="founder-content-wrapper">
            <span className="section-eyebrow">The Founder's Journey</span>
            <h2 className="founder-name-title">{founder.founderName || "Tulsi Prakash"}</h2>
            <div className="founder-role-sub">{founder.role || "Founder & Creative Director"}</div>

            <div className="founder-paragraphs">
              {founder.paragraphs && Array.isArray(founder.paragraphs) ? (
                founder.paragraphs.map((para, idx) => (
                  <p key={idx}>{para}</p>
                ))
              ) : (
                <>
                  <p>
                    I grew up watching the most breathtaking Indian jewellery locked away inside heavy steel almirahs, brought out only twice a year for weddings or festivals. The rest of the year, we settled for mundane, lifeless accessories.
                  </p>
                  <p>
                    AROHVI began with a very clear, stubborn question: why can't we wear evocative, sculptural Indian adornment on a Tuesday afternoon? To college? To an art show? On a solitary coffee run?
                  </p>
                  <p>
                    AROHVI isn't a generic jewellery shop or an inaccessible bridal house. It is a sanctuary for people who treat personal style as an ongoing creative act. Each piece is designed to be lived in, experimented with, and cherished on the most ordinary of days.
                  </p>
                </>
              )}
            </div>

            <div className="founder-quote-banner">
              “{founder.quote || "Wear what makes you, you."}”
            </div>
          </div>
        </div>
      </section>

      {/* 5. Pan-India Delivery & Trust Highlights */}
      <section style={{ backgroundColor: 'var(--color-obsidian)', borderTop: '1px solid var(--color-subtle-border)', padding: '3.5rem 2rem' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
            <div style={{ padding: '0.8rem', backgroundColor: 'var(--color-charcoal-secondary)', border: '1px solid var(--color-subtle-border)', borderRadius: '4px', color: 'var(--color-ruby-red)' }}>
              <Truck size={24} />
            </div>
            <div>
              <h4 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.2rem', color: 'var(--color-warm-ivory)', marginBottom: '0.3rem' }}>Pan-India Express Dispatch</h4>
              <p style={{ fontSize: '0.86rem', color: 'var(--color-warm-ivory-dim)', lineHeight: '1.5' }}>Shipped directly from our Bangalore studio via Bluedart and Delhivery with tracking updates.</p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
            <div style={{ padding: '0.8rem', backgroundColor: 'var(--color-charcoal-secondary)', border: '1px solid var(--color-subtle-border)', borderRadius: '4px', color: 'var(--color-ruby-red)' }}>
              <RefreshCw size={24} />
            </div>
            <div>
              <h4 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.2rem', color: 'var(--color-warm-ivory)', marginBottom: '0.3rem' }}>7-Day Transit Replacement</h4>
              <p style={{ fontSize: '0.86rem', color: 'var(--color-warm-ivory-dim)', lineHeight: '1.5' }}>Zero-friction replacement guarantee if any piece arrives damaged or flawed during courier transit.</p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
            <div style={{ padding: '0.8rem', backgroundColor: 'var(--color-charcoal-secondary)', border: '1px solid var(--color-subtle-border)', borderRadius: '4px', color: 'var(--color-ruby-red)' }}>
              <Shield size={24} />
            </div>
            <div>
              <h4 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.2rem', color: 'var(--color-warm-ivory)', marginBottom: '0.3rem' }}>Accessible Honest Pricing</h4>
              <p style={{ fontSize: '0.86rem', color: 'var(--color-warm-ivory-dim)', lineHeight: '1.5' }}>No inflated bridal margins or fake discounts. Thoughtful pricing between ₹100 and ₹800.</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};
