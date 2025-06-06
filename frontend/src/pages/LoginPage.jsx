import React, { useState } from 'react';
import { Container, TextField, Button, Typography, Box, Link, Alert } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { loginUser } from '../services/api';
import { useThemeContext } from '../ThemeContext';
import { useAuth } from '../AuthContext';

function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toggleColorMode, mode } = useThemeContext();
  const { login: authLogin } = useAuth();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    console.log('handleSubmit gestartet');

    console.log('Versuche loginUser aufzurufen...');
    try {
      const response = await loginUser({ username, master_password: password });
      console.log('loginUser erfolgreich aufgerufen', response.data);
      
      const { token, user_id, salt, two_fa_enabled } = response.data;
      console.log('Daten extrahiert:', { token, user_id, salt, two_fa_enabled });

      console.log('Rufe authLogin auf...');
      await authLogin(username, password, salt, token);
      console.log('authLogin abgeschlossen.');

      console.log('Prüfe two_fa_enabled:', two_fa_enabled);
      if (two_fa_enabled) {
        console.log('2FA aktiviert, leite zu 2FA-Verifizierung weiter (noch nicht implementiert).');
        navigate('/dashboard');
      } else {
        console.log('2FA nicht aktiviert, leite zu /dashboard weiter.');
        navigate('/dashboard');
      }

    } catch (error) {
      console.log('Fehler im handleSubmit catch-Block.', error);
      console.error("Login failed:", error.response?.data || error.message);
      setError(error.response?.data?.error || 'Login fehlgeschlagen. Bitte überprüfen Sie Benutzername und Master-Passwort.');
    }
    setLoading(false);
    console.log('handleSubmit beendet.');
  };

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Typography component="h1" variant="h5">
          Login
        </Typography>
        <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
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
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Master-Passwort"
            type="password"
            id="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error && (
            <Alert severity="error" sx={{ mt: 1 }}>
              {error}
            </Alert>
          )}
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
          >
            Einloggen
          </Button>
          <Link href="/register" variant="body2">
            {"Noch keinen Account? Registrieren"}
          </Link>
        </Box>
      </Box>
    </Container>
  );
}

export default LoginPage; 