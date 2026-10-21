import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import { ManagerProvider } from './context/ManagerContext';
import { CustomerAuthProvider } from './context/CustomerAuthContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { CinematicSlideUpReveal } from './components/CinematicSlideUpReveal';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutModal } from './components/CheckoutModal';
import { TrackOrderModal } from './components/TrackOrderModal';
import { CustomerAuthModal } from './components/CustomerAuthModal';
import { CustomerProfileModal } from './components/CustomerProfileModal';
import { UserHome } from './pages/user/UserHome';
import { ManagerLogin } from './pages/manager/ManagerLogin';
import { ManagerDashboard } from './pages/manager/ManagerDashboard';
import { ProtectedRoute } from './pages/manager/ProtectedRoute';
import { api } from './api/client';

/**
 * Public Customer Storefront
 * Completely isolated from manager tools, with no administrative links or icons.
 */
function CustomerStore({ products, siteContent, onRefreshData }) {
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isRevealOpen, setIsRevealOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isTrackOrderOpen, setIsTrackOrderOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('home');

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
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="app-container">
      {/* Public Navbar (strictly customer-facing) */}
      <Navbar 
        announcement={siteContent?.announcement}
        onNavigate={handleNavigate}
        activeSection={activeSection}
        onOpenTrackOrder={() => setIsTrackOrderOpen(true)}
      />

      {/* Main Public Home */}
      <UserHome 
        siteContent={siteContent}
        products={products}
        onSelectProduct={handleSelectProduct}
        onNavigateToCatalog={() => handleNavigate('catalog')}
        onNavigateToStory={() => handleNavigate('story')}
      />

      {/* Footer */}
      <Footer onNavigate={handleNavigate} />

      {/* Cinematic Slide-Up Product Reveal */}
      <CinematicSlideUpReveal 
        product={selectedProduct}
        isOpen={isRevealOpen}
        onClose={handleCloseReveal}
        onBuyNow={handleBuyNow}
      />

      {/* Customer Cart Drawer */}
      <CartDrawer 
        onProceedToCheckout={() => setIsCheckoutOpen(true)}
      />

      {/* Express Checkout Modal */}
      <CheckoutModal 
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        onOrderPlaced={onRefreshData}
      />

      {/* Track Order Modal */}
      <TrackOrderModal 
        isOpen={isTrackOrderOpen}
        onClose={() => setIsTrackOrderOpen(false)}
      />

      {/* Customer Login & Registration Modal */}
      <CustomerAuthModal />

      {/* Customer Profile & Past Orders Modal */}
      <CustomerProfileModal />
    </div>
  );
}

export default function App() {
  const [products, setProducts] = useState([]);
  const [siteContent, setSiteContent] = useState(null);

  const fetchStoreData = async () => {
    try {
      const [prodRes, contentRes] = await Promise.all([
        api.getProducts(),
        api.getContent()
      ]);
      if (prodRes.success) setProducts(prodRes.data);
      if (contentRes.success) setSiteContent(contentRes.data);
    } catch (err) {
      console.error('Error loading store data:', err);
    }
  };

  useEffect(() => {
    fetchStoreData();
  }, []);

  return (
    <CartProvider>
      <ManagerProvider>
        <CustomerAuthProvider>
          <BrowserRouter>
            <Routes>
              {/* Public Customer Website */}
              <Route 
                path="/" 
                element={
                  <CustomerStore 
                    products={products} 
                    siteContent={siteContent} 
                    onRefreshData={fetchStoreData} 
                  />
                } 
              />

              {/* Direct Manager Login */}
              <Route 
                path="/manager/login" 
                element={<ManagerLogin />} 
              />

              {/* Private Protected Manager Dashboard */}
              <Route 
                path="/manager/dashboard" 
                element={
                  <ProtectedRoute>
                    <ManagerDashboard onRefreshProducts={fetchStoreData} />
                  </ProtectedRoute>
                } 
              />

              {/* Convenience alias for /manager -> /manager/dashboard */}
              <Route 
                path="/manager" 
                element={<Navigate to="/manager/dashboard" replace />} 
              />

              {/* Fallback unknown paths to Customer Home */}
              <Route 
                path="*" 
                element={<Navigate to="/" replace />} 
              />
            </Routes>
          </BrowserRouter>
        </CustomerAuthProvider>
      </ManagerProvider>
    </CartProvider>
  );
}
