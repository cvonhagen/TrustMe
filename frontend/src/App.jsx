import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

// Import page components
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import TwoFactorSetupPage from './pages/TwoFactorSetupPage';
import TwoFactorVerifyPage from './pages/TwoFactorVerifyPage';

import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Routes>
      {/* Öffentliche Routen */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route
        path="/dashboard"
        element={isAuthenticated ? <DashboardPage /> : <LoginPage />}
      />
      <Route
        path="/setup-2fa"
        element={isAuthenticated ? <TwoFactorSetupPage /> : <LoginPage />}
      />
      <Route
        path="/verify-2fa"
        element={isAuthenticated ? <TwoFactorVerifyPage /> : <LoginPage />}
      />
      <Route path="*" element={<LoginPage />} />
    </Routes>
  );
}

export default App;
