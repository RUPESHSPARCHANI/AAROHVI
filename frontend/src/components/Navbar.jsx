import React, { useState } from 'react';
import { ShoppingBag, User, Menu, X } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useCustomerAuth } from '../context/CustomerAuthContext';

export const Navbar = ({ announcement, onNavigate, activeSection, onOpenTrackOrder }) => {
  const { totalItemCount, setIsCartOpen } = useCart();
  const { customer, openAuthModal, setIsProfileModalOpen } = useCustomerAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleMobileNavClick = (sectionId) => {
    setIsMobileMenuOpen(false);
    onNavigate(sectionId);
  };

  const handleMobileTrackClick = () => {
    setIsMobileMenuOpen(false);
    onOpenTrackOrder();
  };

  return (
    <>
      {/* Announcement Bar */}
      {announcement?.enabled !== false && (
        <div className="announcement-bar">
          {announcement?.text || "✨ Free standard shipping across India on orders above ₹499 | Handcrafted oxidised collections"}
        </div>
      )}

      {/* Main Navbar */}
      <nav className="navbar">
        <div className="navbar-container">
          {/* Mobile Hamburger Toggle (Visible on screens <= 860px) */}
          <button
            className="mobile-menu-toggle"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label={isMobileMenuOpen ? "Close menu" : "Open navigation menu"}
          >
            {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>

          {/* Logo & Brand Identity */}
          <a 
            href="#home" 
            className="brand-logo"
            onClick={(e) => {
              e.preventDefault();
              setIsMobileMenuOpen(false);
              onNavigate('home');
            }}
          >
            <span className="brand-name">AROHVI</span>
            <span className="brand-tagline-sub">Adorn the Unordinary</span>
          </a>

          {/* Desktop Navigation Links */}
          <ul className="nav-links desktop-only-nav">
            <li>
              <a 
                href="#catalog" 
                className={`nav-link ${activeSection === 'catalog' ? 'active' : ''}`}
                onClick={(e) => {
                  e.preventDefault();
                  onNavigate('catalog');
                }}
              >
                Collection
              </a>
            </li>
            <li>
              <a 
                href="#philosophy" 
                className={`nav-link ${activeSection === 'philosophy' ? 'active' : ''}`}
                onClick={(e) => {
                  e.preventDefault();
                  onNavigate('philosophy');
                }}
              >
                Philosophy
              </a>
            </li>
            <li>
              <a 
                href="#story" 
                className={`nav-link ${activeSection === 'story' ? 'active' : ''}`}
                onClick={(e) => {
                  e.preventDefault();
                  onNavigate('story');
                }}
              >
                Founder's Story
              </a>
            </li>
            <li>
              <a 
                href="#track" 
                className="nav-link"
                onClick={(e) => {
                  e.preventDefault();
                  onOpenTrackOrder();
                }}
              >
                Track Order
              </a>
            </li>
          </ul>

          {/* Action Icons */}
          <div className="nav-actions">
            {/* Customer Account Button */}
            {customer ? (
              <button
                className="customer-account-btn"
                onClick={() => setIsProfileModalOpen(true)}
                title={`Signed in as ${customer.name}. View Account & Orders.`}
              >
                <div className="customer-avatar-dot">
                  {customer.name?.charAt(0)?.toUpperCase()}
                </div>
                <span className="customer-name-text">{customer.name?.split(' ')[0]}</span>
              </button>
            ) : (
              <button
                className="customer-account-btn"
                onClick={() => openAuthModal('login')}
                title="Sign in to your customer account"
              >
                <User size={14} color="var(--color-muted-champagne)" />
                <span className="customer-signin-text">Sign In</span>
              </button>
            )}

            {/* Shopping Bag Trigger */}
            <button 
              className="icon-btn" 
              onClick={() => setIsCartOpen(true)}
              aria-label="Shopping Bag"
            >
              <ShoppingBag size={21} />
              {totalItemCount > 0 && (
                <span className="badge-count">{totalItemCount}</span>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Slide-Down Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="mobile-nav-drawer">
            <ul className="mobile-nav-list">
              <li>
                <a 
                  href="#catalog"
                  className={`mobile-nav-link ${activeSection === 'catalog' ? 'active' : ''}`}
                  onClick={(e) => {
                    e.preventDefault();
                    handleMobileNavClick('catalog');
                  }}
                >
                  Collection
                </a>
              </li>
              <li>
                <a 
                  href="#philosophy"
                  className={`mobile-nav-link ${activeSection === 'philosophy' ? 'active' : ''}`}
                  onClick={(e) => {
                    e.preventDefault();
                    handleMobileNavClick('philosophy');
                  }}
                >
                  Brand Philosophy
                </a>
              </li>
              <li>
                <a 
                  href="#story"
                  className={`mobile-nav-link ${activeSection === 'story' ? 'active' : ''}`}
                  onClick={(e) => {
                    e.preventDefault();
                    handleMobileNavClick('story');
                  }}
                >
                  Founder's Story
                </a>
              </li>
              <li>
                <a 
                  href="#track"
                  className="mobile-nav-link"
                  onClick={(e) => {
                    e.preventDefault();
                    handleMobileTrackClick();
                  }}
                >
                  Track Order
                </a>
              </li>
              <li className="mobile-nav-divider"></li>
              <li>
                {customer ? (
                  <button
                    className="mobile-account-link"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      setIsProfileModalOpen(true);
                    }}
                  >
                    <User size={15} />
                    <span>My Account & Orders ({customer.name})</span>
                  </button>
                ) : (
                  <button
                    className="mobile-account-link"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      openAuthModal('login');
                    }}
                  >
                    <User size={15} />
                    <span>Customer Sign In / Register</span>
                  </button>
                )}
              </li>
            </ul>
          </div>
        )}
      </nav>
    </>
  );
};
