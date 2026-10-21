import React from 'react';
import { ShoppingBag, Search, ShieldCheck, Sparkles, UserCheck } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useManager } from '../context/ManagerContext';

export const Navbar = ({ announcement, onNavigate, activeSection, onOpenTrackOrder }) => {
  const { totalItemCount, setIsCartOpen } = useCart();
  const { manager, currentView, toggleView, setIsLoginModalOpen } = useManager();

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
          {/* Logo & Brand Identity */}
          <a 
            href="#home" 
            className="brand-logo"
            onClick={(e) => {
              e.preventDefault();
              onNavigate('home');
            }}
          >
            <span className="brand-name">AROHVI</span>
            <span className="brand-tagline-sub">Adorn the Unordinary</span>
          </a>

          {/* Navigation Links */}
          <ul className="nav-links">
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

          {/* Action Icons & Manager Portal Switcher */}
          <div className="nav-actions">
            {/* Manager Switcher Button */}
            {manager ? (
              <button 
                className="manager-switcher-btn"
                onClick={() => toggleView(currentView === 'manager' ? 'store' : 'manager')}
                title="Switch between Store and Admin Dashboard"
              >
                <UserCheck size={14} />
                <span>{currentView === 'manager' ? 'View Store' : 'Manager Hub'}</span>
              </button>
            ) : (
              <button 
                className="manager-switcher-btn"
                onClick={() => setIsLoginModalOpen(true)}
                title="Founder / Manager Login"
              >
                <ShieldCheck size={14} />
                <span>Manager</span>
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
      </nav>
    </>
  );
};
