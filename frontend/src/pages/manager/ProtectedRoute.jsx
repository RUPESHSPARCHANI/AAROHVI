import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useManager } from '../../context/ManagerContext';

export const ProtectedRoute = ({ children }) => {
  const { manager, token } = useManager();
  const location = useLocation();

  if (!manager || !token) {
    return <Navigate to="/manager/login" state={{ from: location }} replace />;
  }

  return children;
};
