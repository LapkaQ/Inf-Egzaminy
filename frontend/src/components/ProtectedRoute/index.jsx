import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

// Ochrona tras – tylko dla zalogowanych
// Niezalogowany → /login
const ProtectedRoute = () => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) return null; // Czekaj na weryfikację tokena

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

export default ProtectedRoute;
