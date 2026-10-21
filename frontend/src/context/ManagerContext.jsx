import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api/client.js';

const ManagerContext = createContext();

export const ManagerProvider = ({ children }) => {
  const [manager, setManager] = useState(() => {
    try {
      const saved = localStorage.getItem('arohvi_manager');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => {
    return localStorage.getItem('arohvi_token') || '';
  });

  // Current view: 'store' (User side) or 'manager' (Manager side)
  const [currentView, setCurrentView] = useState('store');
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  useEffect(() => {
    if (manager && token) {
      localStorage.setItem('arohvi_manager', JSON.stringify(manager));
      localStorage.setItem('arohvi_token', token);
    } else {
      localStorage.removeItem('arohvi_manager');
      localStorage.removeItem('arohvi_token');
    }
  }, [manager, token]);

  const login = async (identifier, password) => {
    try {
      const res = await api.login({ identifier, password });
      if (res.success && res.data) {
        setManager(res.data.manager);
        setToken(res.data.token);
        setCurrentView('manager');
        setIsLoginModalOpen(false);
        return { success: true };
      }
      return { success: false, message: res.message || 'Login failed' };
    } catch (err) {
      return { success: false, message: err.message };
    }
  };

  const logout = () => {
    setManager(null);
    setToken('');
    setCurrentView('store');
  };

  const toggleView = (targetView) => {
    if (targetView === 'manager' && !manager) {
      setIsLoginModalOpen(true);
      return;
    }
    setCurrentView(targetView);
  };

  return (
    <ManagerContext.Provider
      value={{
        manager,
        token,
        currentView,
        setCurrentView,
        isLoginModalOpen,
        setIsLoginModalOpen,
        login,
        logout,
        toggleView
      }}
    >
      {children}
    </ManagerContext.Provider>
  );
};

export const useManager = () => useContext(ManagerContext);
