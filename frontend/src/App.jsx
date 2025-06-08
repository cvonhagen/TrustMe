import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { useAuth } from './AuthContext';

// Import page components
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import TwoFactorSetupPage from './pages/TwoFactorSetupPage';
import TwoFactorVerifyPage from './pages/TwoFactorVerifyPage';
import SettingsPage from './pages/SettingsPage';
// Import Layout component
import Layout from './components/Layout';

function App() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      {/* Öffentliche Routen */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/verify-2fa" element={<TwoFactorVerifyPage />} />

      {/* Geschützte Routen mit Layout */}
      <Route
        path="/"
        element={<Layout />}
      >
        <Route path="dashboard" element={isAuthenticated ? <DashboardPage /> : <LoginPage />} />
        <Route path="setup-2fa" element={isAuthenticated ? <TwoFactorSetupPage /> : <LoginPage />} />
        {/* Einstellungsseite */}
        <Route path="settings" element={isAuthenticated ? <SettingsPage /> : <LoginPage />} />
        
        {/* Standard-Catch-all-Route für authentifizierte Benutzer, um zum Dashboard zu navigieren */}
        <Route path="*" element={isAuthenticated ? <DashboardPage /> : <LoginPage />} />
      </Route>
      
      {/* Fallback für nicht authentifizierte Benutzer zu jeder anderen Route */}
      <Route path="*" element={<LoginPage />} />
    </Routes>
  );
}

export default App;
