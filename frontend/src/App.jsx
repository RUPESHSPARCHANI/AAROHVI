import React, { useState, useEffect } from 'react';
import { CartProvider } from './context/CartContext';
import { ManagerProvider, useManager } from './context/ManagerContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { CinematicSlideUpReveal } from './components/CinematicSlideUpReveal';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutModal } from './components/CheckoutModal';
import { TrackOrderModal } from './components/TrackOrderModal';
import { ManagerLoginModal } from './components/ManagerLoginModal';
import { UserHome } from './pages/user/UserHome';
import { ManagerDashboard } from './pages/manager/ManagerDashboard';
import { api } from './api/client';

function MainApp() {
  const { currentView, toggleView, isLoginModalOpen, setIsLoginModalOpen } = useManager();

  const [products, setProducts] = useState([]);
  const [siteContent, setSiteContent] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isRevealOpen, setIsRevealOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isTrackOrderOpen, setIsTrackOrderOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('home');
  const [loading, setLoading] = useState(true);

  const fetchStoreData = async () => {
    try {
      const [prodRes, contentRes] = await Promise.all([
        api.getProducts(),
        api.getContent()
      ]);
      if (prodRes.success) setProducts(prodRes.data);
      if (contentRes.success) setSiteContent(contentRes.data);
    } catch (err) {
      console.error("Error loading store data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStoreData();
  }, []);

  const handleSelectProduct = (product) => {
    setSelectedProduct(product);
    setIsRevealOpen(true);
  };

  const handleCloseReveal = () => {
    setIsRevealOpen(false);
  };

  const handleBuyNow = () => {
    setIsCheckoutOpen(true);
  };

  const handleNavigate = (sectionId) => {
    setActiveSection(sectionId);
    if (currentView === 'manager') {
      toggleView('store');
    }
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="app-container">
      {/* If current view is Manager side, render ManagerDashboard */}
      {currentView === 'manager' ? (
        <ManagerDashboard 
          onSwitchToStore={() => toggleView('store')}
          onRefreshProducts={fetchStoreData}
        />
      ) : (
        /* Otherwise render the User Storefront */
        <>
          <Navbar 
            announcement={siteContent?.announcement}
            onNavigate={handleNavigate}
            activeSection={activeSection}
            onOpenTrackOrder={() => setIsTrackOrderOpen(true)}
          />

          <UserHome 
            siteContent={siteContent}
            products={products}
            onSelectProduct={handleSelectProduct}
            onNavigateToCatalog={() => handleNavigate('catalog')}
            onNavigateToStory={() => handleNavigate('story')}
          />

          <Footer onNavigate={handleNavigate} />
        </>
      )}

      {/* SIGNATURE WEBSITE INTERACTION: Cinematic Slide-Up Product Reveal */}
      <CinematicSlideUpReveal 
        product={selectedProduct}
        isOpen={isRevealOpen}
        onClose={handleCloseReveal}
        onBuyNow={handleBuyNow}
      />

      {/* Slide-out Cart Drawer */}
      <CartDrawer 
        onProceedToCheckout={() => setIsCheckoutOpen(true)}
      />

      {/* Express Checkout Modal */}
      <CheckoutModal 
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        onOrderPlaced={() => fetchStoreData()}
      />

      {/* Track Order Modal */}
      <TrackOrderModal 
        isOpen={isTrackOrderOpen}
        onClose={() => setIsTrackOrderOpen(false)}
      />

      {/* Manager Login Modal */}
      <ManagerLoginModal 
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <CartProvider>
      <ManagerProvider>
        <MainApp />
      </ManagerProvider>
    </CartProvider>
  );
}
