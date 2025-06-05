import React, { useState } from 'react';
import { Container, Typography, Box, TextField, Button, Alert, Paper } from '@mui/material';
import { verifyTwoFactorLogin } from '../services/api';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../AuthContext';

function TwoFactorVerifyPage() {
  const [code, setCode] = useState('');
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  // Get username from AuthContext user object
  const username = user?.username;

  const handleCodeChange = (event) => {
    setCode(event.target.value);
  };

  const handleVerify = async () => {
    if (!username) {
      setError('Benutzerinformationen nicht verfügbar. Bitte melden Sie sich erneut an.');
      // Consider redirecting to login if user is null
      return;
    }

    if (!code) {
        setError('Bitte geben Sie den Verifizierungscode ein.');
        return;
    }

    setError(null);
    try {
      // Call the backend endpoint to verify the 2FA code during login
      await verifyTwoFactorLogin({ username, code });

      // If verification is successful, navigate to the dashboard
      navigate('/dashboard');

    } catch (err) {
      console.error("2FA verification failed:", err.response?.data || err.message);
      setError(err.response?.data?.detail || '2FA-Verifizierung fehlgeschlagen. Bitte überprüfen Sie den Code.');
    }
  };

  // Optional: Redirect to login if no user information is available
  // useEffect(() => {
  //   if (!username) {
  //     navigate('/login');
  //   }
  // }, [username, navigate]);


  return (
    <Container component="main" maxWidth="sm" sx={{ mt: 8 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography component="h1" variant="h5" align="center" gutterBottom>
          2-Faktor-Verifizierung
        </Typography>
        <Typography variant="body1" paragraph>
          Bitte geben Sie den Code aus Ihrer Authenticator-App ein.
        </Typography>

        <TextField
          margin="normal"
          required
          fullWidth
          id="code"
          label="Verifizierungscode"
          name="code"
          autoComplete="one-time-code"
          value={code}
          onChange={handleCodeChange}
        />

        {error && (
          <Alert severity="error" sx={{ mt: 1 }}>
            {error}
          </Alert>
        )}

        <Button
          type="button"
          fullWidth
          variant="contained"
          sx={{ mt: 3, mb: 2 }}
          onClick={handleVerify}
        >
          Code verifizieren
        </Button>
      </Paper>
    </Container>
  );
}

export default TwoFactorVerifyPage; 