import React, { useState, useEffect } from 'react';
import { Container, Typography, Box, Button, TextField, Paper, Alert } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { verifyTwoFactorLogin } from '../services/api';
import { useAuth } from '../AuthContext';

const TwoFactorVerifyPage = () => {
  const [code, setCode] = useState('');
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { login: authLogin, isAuthenticated } = useAuth();

  const usernameToVerify = location.state?.username;

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    } else if (!usernameToVerify) {
      navigate('/login');
    }
  }, [isAuthenticated, usernameToVerify, navigate]);

  if (isAuthenticated || !usernameToVerify) {
    return null;
  }

  const handleVerify = async () => {
    setError(null);
    try {
      const response = await verifyTwoFactorLogin({ username: usernameToVerify, code });
      
      const { token, salt } = response.data; 
      
      if (token && salt) {
        authLogin(usernameToVerify, null, salt, token);
        navigate('/dashboard');
      } else {
         setError("Verifizierung fehlgeschlagen. Ungültige Antwort vom Server.");
      }
    } catch (err) {
      console.error("2FA Verification failed:", err.response?.data || err.message);
      setError(err.response?.data?.error || "2FA Verifizierung fehlgeschlagen.");
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          2FA Code verifizieren
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
  );
};

export default TwoFactorVerifyPage; 