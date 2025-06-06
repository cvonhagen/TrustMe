import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { useAuth } from './AuthContext';

// Import placeholder page components
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import TwoFactorSetupPage from './pages/TwoFactorSetupPage';
import TwoFactorVerifyPage from './pages/TwoFactorVerifyPage';

import ProtectedRoute from './components/ProtectedRoute';

function App() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
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
