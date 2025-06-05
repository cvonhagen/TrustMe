import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../AuthContext';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, is2FAVerified } = useAuth();
  const location = useLocation();

  // Wenn der Benutzer nicht authentifiziert ist, zur Login-Seite weiterleiten
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Wenn der Benutzer authentifiziert ist, aber 2FA nicht verifiziert wurde
  if (isAuthenticated && !is2FAVerified) {
    return <Navigate to="/2fa/verify" state={{ from: location }} replace />;
  }

  // Wenn alles in Ordnung ist, die geschützte Komponente rendern
  return children;
};

export default ProtectedRoute; 