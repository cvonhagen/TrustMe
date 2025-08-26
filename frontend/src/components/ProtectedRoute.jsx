import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../AuthContext';

const ProtectedRoute = () => {
  const { isAuthenticated, is2FAVerified } = useAuth();
  const location = useLocation();

  // Wenn der Benutzer nicht authentifiziert ist, zur Login-Seite weiterleiten
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Wenn der Benutzer authentifiziert ist, aber 2FA nicht verifiziert wurde
  if (isAuthenticated && !is2FAVerified) {
    return <Navigate to="/verify-2fa" state={{ from: location }} replace />;
  }

  // Wenn alles in Ordnung ist, die geschützte Komponente rendern
  return <Outlet />;
};

export default ProtectedRoute;