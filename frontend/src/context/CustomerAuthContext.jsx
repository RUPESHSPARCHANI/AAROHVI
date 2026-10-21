import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api/client';

const CustomerAuthContext = createContext();

export const CustomerAuthProvider = ({ children }) => {
  const [customer, setCustomer] = useState(() => {
    try {
      const saved = localStorage.getItem('arohvi_customer');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [customerToken, setCustomerToken] = useState(() => {
    return localStorage.getItem('arohvi_customer_token') || '';
  });

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState('login'); // 'login' | 'register'
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [customerOrders, setCustomerOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // Sync to localStorage
  useEffect(() => {
    if (customer && customerToken) {
      localStorage.setItem('arohvi_customer', JSON.stringify(customer));
      localStorage.setItem('arohvi_customer_token', customerToken);
    } else {
      localStorage.removeItem('arohvi_customer');
      localStorage.removeItem('arohvi_customer_token');
    }
  }, [customer, customerToken]);

  // Load customer orders when authenticated
  const fetchCustomerOrders = async () => {
    if (!customerToken) return;
    setLoadingOrders(true);
    try {
      const res = await api.getCustomerOrders(customerToken);
      if (res.success && res.data) {
        setCustomerOrders(res.data);
      }
    } catch (err) {
      console.error('Error fetching customer orders:', err);
    } finally {
      setLoadingOrders(false);
    }
  };

  useEffect(() => {
    if (customer && customerToken) {
      fetchCustomerOrders();
    } else {
      setCustomerOrders([]);
    }
  }, [customer, customerToken]);

  const login = async (email, password) => {
    try {
      const res = await api.customerLogin({ email, password });
      if (res.success && res.data) {
        setCustomer(res.data.customer);
        setCustomerToken(res.data.token);
        setIsAuthModalOpen(false);
        return { success: true, message: res.message };
      }
      return { success: false, message: res.message || 'Login failed' };
    } catch (err) {
      return { success: false, message: err.message };
    }
  };

  const register = async (customerData) => {
    try {
      const res = await api.customerRegister(customerData);
      if (res.success && res.data) {
        setCustomer(res.data.customer);
        setCustomerToken(res.data.token);
        setIsAuthModalOpen(false);
        return { success: true, message: res.message };
      }
      return { success: false, message: res.message || 'Registration failed' };
    } catch (err) {
      return { success: false, message: err.message };
    }
  };

  const logout = () => {
    setCustomer(null);
    setCustomerToken('');
    setCustomerOrders([]);
    setIsProfileModalOpen(false);
  };

  const updateProfile = async (updates) => {
    if (!customerToken) return { success: false, message: 'Not authenticated' };
    try {
      const res = await api.updateCustomerProfile(updates, customerToken);
      if (res.success && res.data) {
        setCustomer(res.data);
        return { success: true, message: res.message };
      }
      return { success: false, message: res.message || 'Update failed' };
    } catch (err) {
      return { success: false, message: err.message };
    }
  };

  const openAuthModal = (mode = 'login') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  return (
    <CustomerAuthContext.Provider
      value={{
        customer,
        customerToken,
        isAuthModalOpen,
        setIsAuthModalOpen,
        authModalMode,
        setAuthModalMode,
        openAuthModal,
        isProfileModalOpen,
        setIsProfileModalOpen,
        customerOrders,
        loadingOrders,
        login,
        register,
        logout,
        updateProfile,
        fetchCustomerOrders
      }}
    >
      {children}
    </CustomerAuthContext.Provider>
  );
};

export const useCustomerAuth = () => useContext(CustomerAuthContext);
