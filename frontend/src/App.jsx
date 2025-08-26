import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';

// Import page components
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import TwoFactorSetupPage from './pages/TwoFactorSetupPage';
import TwoFactorVerifyPage from './pages/TwoFactorVerifyPage';

import ProtectedRoute from './components/ProtectedRoute';
import { useAuth } from './AuthContext';

function App() {
  const { isAuthenticated, loadingAuth } = useAuth();

  if (loadingAuth) {
    return <div>Loading authentication...</div>; // Or a proper loading spinner
  }

  return (
    <Routes>
      {/* Öffentliche Routen */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Geschützte Routen */}
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/setup-2fa" element={<TwoFactorSetupPage />} />
        <Route path="/verify-2fa" element={<TwoFactorVerifyPage />} />
      </Route>

      {/* Fallback-Route für nicht gefundene Pfade oder nicht authentifizierte Zugriffe */}
      <Route path="/" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
      <Route path="*" element={<LoginPage />} />
    </Routes>
  );
}

export default App;
