import React, { useState, useContext } from 'react';
import { Container, Typography, Paper, Box, Button, TextField, CircularProgress, Alert } from '@mui/material';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import { useAuth } from '../AuthContext';
import { useNavigate } from 'react-router-dom';
import { setupTwoFactor } from '../services/api';
import Footer from '../components/Footer';

// Komponente für die Zwei-Faktor-Authentifizierungs-Einrichtungsseite.
const TwoFactorSetupPage = () => {
  // Zustandsvariablen für die QR-Code-URL, den geheimen Schlüssel, Fehler und Erfolgsmeldungen.
  const [qrCodeUrl, setQrCodeUrl] = useState(''); 
  const [secret, setSecret] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  // Hook für die Navigation
  const { logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Weiterleitung, falls der Benutzer nicht authentifiziert ist.
  if (!isAuthenticated) {
    navigate('/login');
    return null; 
  }

  // Handler für das Starten des 2FA-Setups.
  const handleSetup = async () => {
    setError(null);    // Fehler zurücksetzen
    setSuccess(null);   // Erfolgsmeldung zurücksetzen
    setQrCodeUrl('');  // QR-Code-URL zurücksetzen
    setSecret('');     // Geheimen Schlüssel zurücksetzen
    try {
      // API-Aufruf zum Initiieren des 2FA-Setups (kein Passwort erforderlich).
      const response = await setupTwoFactor(); 
      
      // Extraktion der Bereitstellungs-URL und des geheimen Schlüssels aus der Antwort.
      const { provisioning_url, secret } = response.data;

      // Überprüfung, ob beide Felder vorhanden sind.
      if (provisioning_url && secret) {
        setQrCodeUrl(provisioning_url);
        setSecret(secret);
        setSuccess("2FA Setup erfolgreich. Scannen Sie den QR-Code und verifizieren Sie ihn.");
      } else {
        setError("Fehler beim Starten des 2FA-Setups: Ungültige Antwort vom Server."); // Spezifischere Fehlermeldung.
      }
    } catch (err) {
      // Fehlerbehandlung: Fehlermeldung aus der API-Antwort extrahieren oder generische Nachricht anzeigen.
      setError(err.response?.data?.error || "2FA Setup fehlgeschlagen.");
    }
  };

  return (
    <>
    <Container maxWidth="md" sx={{ paddingBottom: '100px' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, mt: 3 }}>
        <Typography variant="h4" component="h1">
          2FA Einrichtung
        </Typography>
        <Button 
          variant="contained" 
          color="secondary" 
          startIcon={<ExitToAppIcon />}
          onClick={handleLogout}
        >
          Logout
        </Button>
      </Box>
      
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Zwei-Faktor-Authentifizierung einrichten
        </Typography>
        <Typography variant="body1" sx={{ mb: 3 }}>
          Die Zwei-Faktor-Authentifizierung (2FA) bietet eine zusätzliche Sicherheitsebene für Ihr TrustMe-Konto. Sie erfordert zusätzlich zu Ihrem Master-Passwort einen zweiten Verifizierungsschritt (z.B. einen Code von einer Authenticator-App), um sich anzumelden. Dies schützt Ihr Konto selbst dann, wenn Ihr Passwort kompromittiert wird.
        </Typography>
        <Paper elevation={2} sx={{ p: 3 }}>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

          {!qrCodeUrl ? (
            <>
              <Typography variant="body1" gutterBottom>
                Klicken Sie auf 'Setup starten', um Ihren 2FA QR-Code zu generieren.
              </Typography>
              <Button variant="contained" color="primary" onClick={handleSetup} sx={{ mt: 2 }}>
                Setup starten
              </Button>
            </>
          ) : (
            <>
              <Typography variant="body1" gutterBottom>
                Scannen Sie diesen QR-Code mit Ihrer Authenticator-App (z.B. Google Authenticator, Authy).
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
                <img src={qrCodeUrl} alt="2FA QR Code" style={{ maxWidth: '200px', height: 'auto' }} />
              </Box>
              <Typography variant="body2" align="center" gutterBottom>
                Oder geben Sie diesen geheimen Schlüssel manuell ein: <strong>{secret}</strong>
              </Typography>
              <Button variant="outlined" onClick={() => navigate('/two-factor-verify')} sx={{ mt: 2 }}>
                Code verifizieren
              </Button>
            </>
          )}
        </Paper>
      </Box>
    </Container>
    <Footer />
    </>
  );
};

export default TwoFactorSetupPage;