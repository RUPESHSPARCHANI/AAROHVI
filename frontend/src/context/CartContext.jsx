import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState(() => {
    try {
      const saved = localStorage.getItem('arohvi_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [shippingThreshold, setShippingThreshold] = useState(499);
  const [standardShippingFee, setStandardShippingFee] = useState(49);

  useEffect(() => {
    try {
      localStorage.setItem('arohvi_cart', JSON.stringify(cartItems));
    } catch (e) {
      console.error(e);
    }
  }, [cartItems]);

  const addToCart = (product, quantity = 1, variant = null) => {
    setCartItems(prev => {
      const itemKey = `${product.id}-${variant || 'default'}`;
      const existing = prev.find(item => item.key === itemKey);
      if (existing) {
        return prev.map(item =>
          item.key === itemKey
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [
        ...prev,
        {
          key: itemKey,
          id: product.id,
          name: product.name,
          price: product.price,
          original_price: product.original_price,
          image_url: product.image_url,
          variant: variant || (product.variants && product.variants[0]?.name) || 'Standard Fit',
          quantity
        }
      ];
    });
    setIsCartOpen(true);
  };

  const updateQuantity = (key, delta) => {
    setCartItems(prev =>
      prev
        .map(item => {
          if (item.key === key) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean)
    );
  };

  const removeFromCart = key => {
    setCartItems(prev => prev.filter(item => item.key !== key));
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const isFreeShipping = subtotal >= shippingThreshold;
  const shippingFee = cartItems.length === 0 ? 0 : (isFreeShipping ? 0 : standardShippingFee);
  const total = subtotal + shippingFee;
  const totalItemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        isCartOpen,
        setIsCartOpen,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        subtotal,
        shippingFee,
        total,
        isFreeShipping,
        shippingThreshold,
        totalItemCount
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
