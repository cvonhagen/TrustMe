import React, { useState, useEffect } from 'react';
import { Container, Typography, Paper, Box, Button, TextField, CircularProgress, Alert } from '@mui/material';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import { useNavigate, useLocation } from 'react-router-dom';
import { verifyTwoFactorLogin } from '../services/api';
import { useAuth } from '../AuthContext';
import Footer from '../components/Footer';

// Komponente für die 2FA-Verifizierungsseite beim Login.
const TwoFactorVerifyPage = () => {
  // Zustandsvariablen für den Verifizierungscode und Fehler
  const [code, setCode] = useState('');
  const [error, setError] = useState(null);
  // Hooks für Navigation und Location-State
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  const location = useLocation();
  // Authentifizierungskontext
  const { login: authLogin, isAuthenticated } = useAuth();

  // Benutzernamen aus dem Location-State abrufen
  const usernameToVerify = location.state?.username;

  // useEffect-Hook zur Handhabung der Navigation basierend auf Authentifizierungsstatus
  useEffect(() => {
    // Wenn bereits authentifiziert, zum Dashboard navigieren
    if (isAuthenticated) {
      navigate('/dashboard');
    } else if (!usernameToVerify) {
      // Wenn kein Benutzername vorhanden ist (direkter Zugriff), zur Login-Seite navigieren
      navigate('/login');
    }
  }, [isAuthenticated, usernameToVerify, navigate]);

  // Wenn authentifiziert oder kein Benutzername, nichts rendern (Weiterleitung wird im useEffect gehandhabt)
  if (isAuthenticated || !usernameToVerify) {
    return null;
  }

  // Handler für die Verifizierung des 2FA-Codes
  const handleVerify = async () => {
    setError(null); // Vorherige Fehler zurücksetzen
    try {
      // API-Aufruf zur Verifizierung des 2FA-Logins
      const response = await verifyTwoFactorLogin({ username: usernameToVerify, code });
      
      // Token und Salt aus der Antwort extrahieren
      const { token, salt } = response.data; 
      
      // Bei erfolgreicher Verifizierung: Login im AuthContext durchführen und zum Dashboard navigieren
      if (token && salt) {
        authLogin(usernameToVerify, null, salt, token);
        navigate('/dashboard');
      } else {
         setError("Verifizierung fehlgeschlagen. Ungültige Antwort vom Server.");
      }
    } catch (err) {
      // Fehlerbehandlung: Fehlermeldung anzeigen
      setError(err.response?.data?.error || "2FA Verifizierung fehlgeschlagen.");
    }
  };

  return (
    <>
    <Container maxWidth="md" sx={{ paddingBottom: '100px' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, mt: 3 }}>
        <Typography variant="h4" component="h1">
          2FA Verifizierung
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
      
      {/* Rest der Komponente bleibt unverändert */}
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          2FA Code verifizieren
        </Typography>
        <Typography variant="body1" sx={{ mb: 3 }}>
          Um Ihre Anmeldung abzuschließen und die Sicherheit Ihres Kontos zu gewährleisten, geben Sie bitte den sechsstelligen Code ein, der von Ihrer Authenticator-App generiert wurde. Dieser Code ändert sich alle 30-60 Sekunden.
        </Typography>
        <Paper elevation={2} sx={{ p: 3 }}>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <Typography variant="body1" gutterBottom>
            Geben Sie den Code aus Ihrer Authenticator-App für Benutzer <strong>{usernameToVerify}</strong> ein.
          </Typography>
          <TextField
            label="Verifizierungscode"
            fullWidth
            margin="normal"
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
          <Button variant="contained" color="primary" onClick={handleVerify} sx={{ mt: 2 }}>
            Code verifizieren
          </Button>
        </Paper>
      </Box>
    </Container>
    <Footer />
    </>
  );
};

export default TwoFactorVerifyPage;