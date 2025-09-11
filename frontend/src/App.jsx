import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';

// Import page components
import WelcomePage from './pages/WelcomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import DashboardPage from './pages/DashboardPage';
import TwoFactorSetupPage from './pages/TwoFactorSetupPage';
import TwoFactorVerifyPage from './pages/TwoFactorVerifyPage';
import ImpressumPage from './pages/ImpressumPage';
import DatenschutzPage from './pages/DatenschutzPage';


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
      <Route path="/welcome" element={<WelcomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />
      <Route path="/impressum" element={<ImpressumPage />} />
      <Route path="/datenschutz" element={<DatenschutzPage />} />


      {/* Geschützte Routen */}
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/setup-2fa" element={<TwoFactorSetupPage />} />
        <Route path="/verify-2fa" element={<TwoFactorVerifyPage />} />
      </Route>

      {/* Fallback-Route für nicht gefundene Pfade oder nicht authentifizierte Zugriffe */}
      <Route path="/" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <WelcomePage />} />
      <Route path="*" element={<WelcomePage />} />
    </Routes>
  );
}

export default App;
