// TrustMe Frontend - Haupt-App-Komponente
// Zentrale Routing-Logik für alle Seiten der Passwort-Manager-Anwendung
// Unterscheidet zwischen öffentlichen und geschützten Routen

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';

// Seiten-Komponenten importieren
// Öffentliche Seiten (ohne Anmeldung zugänglich)
import WelcomePage from './pages/WelcomePage';           // Startseite mit App-Beschreibung
import LoginPage from './pages/LoginPage';               // Benutzer-Anmeldung
import RegisterPage from './pages/RegisterPage';         // Benutzer-Registrierung
import VerifyEmailPage from './pages/VerifyEmailPage';   // E-Mail-Verifizierung nach Registrierung
import ImpressumPage from './pages/ImpressumPage';       // Rechtliche Informationen
import DatenschutzPage from './pages/DatenschutzPage';   // Datenschutzerklärung

// Geschützte Seiten (nur für angemeldete Benutzer)
import DashboardPage from './pages/DashboardPage';             // Haupt-Dashboard mit Passwort-Übersicht
import TwoFactorSetupPage from './pages/TwoFactorSetupPage';   // 2FA-Einrichtung
import TwoFactorVerifyPage from './pages/TwoFactorVerifyPage'; // 2FA-Verifizierung beim Login

// Routing-Komponenten
import ProtectedRoute from './components/ProtectedRoute';  // Hülle für geschützte Routen
import { useAuth } from './AuthContext';                   // Authentifizierungs-Kontext

function App() {
  // Authentifizierungsstatus aus Context abrufen
  const { isAuthenticated, loadingAuth } = useAuth();

  // Loading-Zustand während der Authentifizierungs-Prüfung anzeigen
  if (loadingAuth) {
    return <div>Loading authentication...</div>; // TODO: Durch echten Spinner ersetzen
  }

  return (
    <Routes>
      {/* Öffentliche Routen - keine Anmeldung erforderlich */}
      <Route path="/welcome" element={<WelcomePage />} />         {/* App-Startseite */}
      <Route path="/login" element={<LoginPage />} />             {/* Anmelde-Formular */}
      <Route path="/register" element={<RegisterPage />} />       {/* Registrierungs-Formular */}
      <Route path="/verify-email" element={<VerifyEmailPage />} /> {/* E-Mail-Bestätigung */}
      <Route path="/impressum" element={<ImpressumPage />} />      {/* Rechtliche Angaben */}
      <Route path="/datenschutz" element={<DatenschutzPage />} />  {/* Datenschutz-Info */}

      {/* Geschützte Routen - nur für angemeldete Benutzer */}
      {/* ProtectedRoute prüft Authentifizierung und leitet bei Bedarf zur Anmeldung um */}
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<DashboardPage />} />           {/* Haupt-App mit Passwort-Liste */}
        <Route path="/setup-2fa" element={<TwoFactorSetupPage />} />      {/* 2FA-Konfiguration */}
        <Route path="/verify-2fa" element={<TwoFactorVerifyPage />} />    {/* 2FA-Code-Eingabe */}
      </Route>

      {/* Fallback-Routen für Weiterleitung und 404-Fälle */}
      {/* Wurzel-Route: Dashboard für angemeldete, Welcome für nicht-angemeldete Benutzer */}
      <Route path="/" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <WelcomePage />} />
      {/* Catch-All Route: Alle unbekannten URLs zur Welcome-Seite */}
      <Route path="*" element={<WelcomePage />} />
    </Routes>
  );
}

export default App;
