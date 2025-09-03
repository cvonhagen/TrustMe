import React, { useState } from 'react';
import { Container, TextField, Button, Typography, Box, Link, Paper, Alert } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { registerUser } from '../services/api';
import Footer from '../components/Footer';

// RegisterPage-Komponente für die Benutzerregistrierung.
function RegisterPage() {
  // Zustandsvariablen für Benutzername, Passwort, Fehler- und Erfolgsmeldungen
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null); // Fehler auf null initialisieren
  const [success, setSuccess] = useState(null); // Erfolg auf null initialisieren
  // Hook für die Navigation
  const navigate = useNavigate();

  // handleSubmit behandelt den Registrierungsvorgang.
  const handleSubmit = async (event) => {
    event.preventDefault(); // Standardformularübermittlung verhindern
    setError(null); // Vorherige Fehler zurücksetzen
    setSuccess(null); // Vorherige Erfolgsmeldungen zurücksetzen

    // Clientseitige Validierung der Eingabefelder
    if (!username || !password) {
      setError('Bitte füllen Sie alle Felder aus.');
      return;
    }

    if (password.length < 8) {
      setError('Das Passwort muss mindestens 8 Zeichen lang sein.');
      return;
    }

    try {
      // API-Aufruf zur Registrierung des Benutzers
      await registerUser({ 
        username, 
        master_password: password 
      });

      setSuccess('Registrierung erfolgreich! Sie werden zum Login weitergeleitet...');
      // Felder nach erfolgreicher Registrierung leeren
      setUsername('');
      setPassword('');
      // Nach 2 Sekunden zum Login-Bildschirm weiterleiten
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      // Fehlerbehandlung: Fehlermeldung aus der API-Antwort extrahieren oder generische Nachricht anzeigen.
      setError(err.response?.data?.error || 'Registrierung fehlgeschlagen. Bitte versuchen Sie es erneut.');
    }
  };

  return (
    <>
    <Container 
      component="main" 
      maxWidth="xs" 
      sx={{
        minHeight: 'calc(100vh - 80px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        paddingBottom: '100px'
      }}
    >
      <Paper 
        elevation={3} 
        sx={{
          p: 4,
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        {/* Überschrift der Registrierungsseite */}
        <Typography component="h1" variant="h5" sx={{ mb: 3 }}>
          Registrieren
        </Typography>
        {/* Beschreibungstext für die Registrierungsseite */}
        <Typography variant="body1" sx={{ mb: 3, textAlign: 'center' }}>
          Erstellen Sie Ihr TrustMe-Konto, um Ihre Passwörter sicher zu speichern und zu verwalten. Es ist schnell und einfach!
        </Typography>
        {/* Registrierungsformular */}
        <Box component="form" onSubmit={handleSubmit} noValidate sx={{ width: '100%' }}>
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
            error={!!error}
          />
          {/* Master-Passwort-Eingabefeld */}
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Master-Passwort"
            type="password"
            id="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={!!error}
            helperText={password.length > 0 && password.length < 8 ? "Mindestens 8 Zeichen" : ""}
          />
          {/* Anzeige von Fehlermeldungen */}
          {error && (
            <Alert severity="error" sx={{ mt: 2, mb: 3 }}>
              {error}
            </Alert>
          )}
          {/* Anzeige von Erfolgsmeldungen */}
          {success && (
            <Alert severity="success" sx={{ mt: 2, mb: 3 }}>
              {success}
            </Alert>
          )}
          {/* Registrieren Button */}
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
          >
            Registrieren
          </Button>
          {/* Link zum Login */}
          <Box sx={{ textAlign: 'center' }}>
            <Link href="/login" variant="body2">
              {"Sie haben bereits einen Account? Einloggen"}
            </Link>
          </Box>
        </Box>
      </Paper>
    </Container>
    <Footer />
    </>
  );
}

export default RegisterPage; 