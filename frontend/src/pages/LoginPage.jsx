import React, { useState } from 'react';
import { Container, TextField, Button, Typography, Box, Link, Alert, Paper } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { loginUser, registerUser, verifyTwoFactorLogin } from '../services/api';
import { useThemeContext } from '../ThemeContext';
import { useAuth } from '../AuthContext';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import Header from '../components/Header';
import Footer from '../components/Footer';

// LoginPage-Komponente für die Benutzeranmeldung und -registrierung.
const LoginPage = () => {
  // Zustandsvariablen zur Steuerung des Formulars und der Benutzeroberfläche
  const [isLogin, setIsLogin] = useState(true); // Schaltet zwischen Login- und Registrierungsansicht um
  const [username, setUsername] = useState('');     // Zustand für den Benutzernamen
  const [email, setEmail] = useState('');           // Zustand für die E-Mail-Adresse (nur Registrierung)
  const [masterPassword, setMasterPassword] = useState(''); // Zustand für das Master-Passwort
  const [twoFACode, setTwoFACode] = useState('');       // Zustand für den 2FA-Code
  const [showTwoFAInput, setShowTwoFAInput] = useState(false); // Zustand, ob 2FA-Eingabe angezeigt wird
  const [tempUsername, setTempUsername] = useState(''); // Temporärer Zustand für den Benutzernamen während des 2FA-Flows
  const [tempMasterPassword, setTempMasterPassword] = useState(''); // Temporäres Master-Passwort für 2FA-Verifizierung
  const [loginError, setLoginError] = useState(null); // Zustand für Anmelde-/Registrierungsfehler

  // Hooks für Navigation und Kontext-Zugriff
  const navigate = useNavigate(); // Hook für die Navigation
  const { login } = useAuth();    // Zugriff auf die Login-Funktion aus dem AuthContext
  const { toggleColorMode, mode } = useThemeContext(); // Zugriff auf Theme-Funktionen (Hell-/Dunkelmodus)

  // handleLoginSubmit behandelt den Anmeldevorgang.
  const handleLoginSubmit = async (e) => {
    e.preventDefault(); // Standardformularübermittlung verhindern
    setLoginError(null); // Vorherige Fehler zurücksetzen

    try {
      // API-Aufruf zur Benutzeranmeldung
      const response = await loginUser({ username, master_password: masterPassword });
      // Extrahieren der relevanten Daten aus der API-Antwort
      const { token, two_fa_enabled, salt } = response.data;

      if (two_fa_enabled) {
        // Wenn 2FA aktiviert ist: 2FA-Eingabefeld anzeigen und temporäre Daten speichern
        setShowTwoFAInput(true);
        setTempUsername(username);
        setTempMasterPassword(masterPassword);
        // NICHT einloggen, bis 2FA verifiziert ist
      } else {
        // Wenn 2FA nicht aktiviert ist: Benutzer direkt anmelden und zum Dashboard navigieren
        await login(username, masterPassword, salt, token); 
        navigate('/dashboard'); 
      }
    } catch (err) {
      // Fehlerbehandlung bei der Anmeldung
      setLoginError(err.response?.data?.error || 'Anmeldung fehlgeschlagen. Bitte versuchen Sie es erneut.'); 
      setShowTwoFAInput(false); // 2FA-Eingabe bei Anmeldefehler verbergen
    }
  };

  // handleTwoFASubmit verarbeitet die 2FA-Code-Verifizierung.
  const handleTwoFASubmit = async (e) => {
    e.preventDefault(); // Standardformularübermittlung verhindern
    setLoginError(null); // Vorherige Fehler zurücksetzen
    try {
      // API-Aufruf zur Verifizierung des 2FA-Codes
      const response = await verifyTwoFactorLogin({ username: tempUsername, code: twoFACode });
      // Extrahieren der relevanten Daten aus der 2FA-Verifizierungs-Antwort
      const { token, salt } = response.data;
      
      // Jetzt erst einloggen mit den korrekten Daten
      await login(tempUsername, tempMasterPassword, salt, token);
      // Bei erfolgreicher 2FA-Verifizierung: Zum Dashboard navigieren
      navigate('/dashboard'); 
    } catch (err) {
      // Fehlerbehandlung bei der 2FA-Verifizierung
      setLoginError(err.response?.data?.error || '2FA-Verifizierung fehlgeschlagen. Ungültiger Code.'); 
    }
  };

  // handleRegisterSubmit verarbeitet den Registrierungsvorgang.
  const handleRegisterSubmit = async (e) => {
    e.preventDefault(); // Standardformularübermittlung verhindern
    setLoginError(null); // Vorherige Fehler zurücksetzen

    try {
      // API-Aufruf zur Benutzerregistrierung
      await registerUser({ username, email, master_password: masterPassword });
      // Nach erfolgreicher Registrierung zur Login-Ansicht wechseln und Erfolgsmeldung anzeigen
      setIsLogin(true); 
      setLoginError('Registrierung erfolgreich! Bitte melden Sie sich jetzt an.'); 
    } catch (err) {
      // Fehlerbehandlung bei der Registrierung
      setLoginError(err.response?.data?.error || 'Registrierung fehlgeschlagen. Bitte versuchen Sie es erneut.'); 
    }
  };

  return (
    <>
    <Header />
    <Container component="main" maxWidth="sm" sx={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 'calc(100vh - 160px)', // Angepasst für Header und festen Footer
      color: 'text.primary',
      px: 2,
      py: 4,
      paddingBottom: '100px' // Extra Platz für festen Footer
    }}>
      <Paper elevation={3} sx={{
        p: 4,
        width: '100%',
        maxWidth: 'sm',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        backgroundColor: 'background.paper',
        borderRadius: 2,
        boxShadow: 3
      }}>
      {/* Umschalt-Button für den Dunkel-/Hellmodus */}
      <Box sx={{ position: 'relative', width: '100%', mb: 2 }}>
        <Button 
          onClick={toggleColorMode} 
          color="inherit" 
          sx={{ 
            position: 'absolute', 
            right: 0, 
            top: 0,
            minWidth: 'unset', 
            padding: '8px' 
          }}
        >
          {mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
        </Button>
      </Box>

      <Box sx={{ textAlign: 'center' }}>
        {/* Willkommensnachricht */}
        <Typography variant="h6" sx={{ mb: 1, color: 'text.primary' }}>
          Willkommen zurück!
        </Typography>
        <Typography variant="body2" sx={{ mb: 3, color: 'text.secondary' }}>
          Melden Sie sich an, um auf Ihre sicher verschlüsselten Passwörter zuzugreifen.
        </Typography>
        
        {/* Überschrift für Login oder Registrierung */}
        <Typography component="h2" variant="h5" sx={{ mb: 2 }}>
          {isLogin ? 'Anmelden' : 'Registrieren'}
        </Typography>
        
        {/* Anzeige von Fehlermeldungen */}
        {loginError && <Alert severity="error" sx={{ mt: 2, mb: 3 }}>{loginError}</Alert>}

        {/* Conditional Rendering des Login-/Registrierungsformulars oder 2FA-Eingabefelds */}
        {!showTwoFAInput ? (
          <Box component="form" onSubmit={isLogin ? handleLoginSubmit : handleRegisterSubmit} sx={{ mt: 1 }}>
            {/* Benutzernamen-Eingabefeld */}
            <TextField
              margin="normal"
              required
              fullWidth
              id="username"
              label="Benutzername"
              name="username"
              autoComplete="username"
              autoFocus
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              sx={{ mb: 2 }}
            />
            {/* E-Mail-Eingabefeld (nur für Registrierung) */}
            {!isLogin && (
              <TextField
                margin="normal"
                required
                fullWidth
                id="email"
                label="E-Mail-Adresse"
                name="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                sx={{ mb: 2 }}
              />
            )}
            {/* Master-Passwort-Eingabefeld */}
            <TextField
              margin="normal"
              required
              fullWidth
              name="masterPassword"
              label="Master-Passwort"
              type="password"
              id="masterPassword"
              autoComplete={isLogin ? "current-password" : "new-password"}
              value={masterPassword}
              onChange={(e) => setMasterPassword(e.target.value)}
              sx={{ mb: 3 }}
            />
            {/* Anmelden/Registrieren Button */}
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 1, mb: 2 }}
            >
              {isLogin ? 'Anmelden' : 'Registrieren'}
            </Button>
          </Box>
        ) : (
          // 2FA-Eingabefeld-Formular
          <Box component="form" onSubmit={handleTwoFASubmit} sx={{ mt: 1 }}>
            <Typography variant="subtitle1" sx={{ mb: 2 }}>
              Bitte geben Sie Ihren 2FA-Code ein:
            </Typography>
            {/* 2FA-Code-Eingabefeld */}
            <TextField
              margin="normal"
              required
              fullWidth
              id="twoFACode"
              label="2FA Code"
              name="twoFACode"
              value={twoFACode}
              onChange={(e) => setTwoFACode(e.target.value)}
              sx={{ mb: 2 }}
            />
            {/* 2FA Code verifizieren Button */}
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 1, mb: 2 }}
            >
              2FA Code verifizieren
            </Button>
          </Box>
        )}

        {/* Link zum Umschalten zwischen Login und Registrierung */}
        <Link
          component="button"
          variant="body2"
          onClick={() => {
            setIsLogin(!isLogin);
            setLoginError(null); // Fehler beim Wechsel des Modus zurücksetzen
            setShowTwoFAInput(false); // 2FA-Eingabe bei Moduswechsel verbergen
          }}
          sx={{ mt: 2, display: 'block' }}
        >
          {isLogin ? 'Noch kein Konto? Registrieren' : 'Bereits ein Konto? Anmelden'}
        </Link>

        {/* Link zurück zur Startseite */}
        <Link
          component="button"
          variant="body2"
          onClick={() => navigate('/')}
          sx={{ mt: 1, color: 'text.secondary' }}
        >
          ← Zurück zur Startseite
        </Link>
      </Box>
    </Paper>
  </Container>
  <Footer />
  </>
  );
};

export default LoginPage;