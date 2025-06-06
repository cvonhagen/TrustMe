import React, { useState, useContext } from 'react';
import { Container, Typography, Box, Button, TextField, Paper, Alert } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { setupTwoFactor } from '../services/api';
import { useAuth } from '../AuthContext';

const TwoFactorSetupPage = () => {
  // Removed password state as it's not needed for initiation in Go backend
  // const [password, setPassword] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState(''); // Renamed state variable for clarity
  const [secret, setSecret] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  // Redirect if not authenticated
  if (!isAuthenticated) {
    navigate('/login');
    return null; // Or a loading spinner
  }

  const handleSetup = async () => {
    setError(null);
    setSuccess(null);
    setQrCodeUrl(''); // Use the renamed state variable
    setSecret('');
    try {
      // No password needed in the request body for Go backend setup initiation
      const response = await setupTwoFactor(); 
      
      // Adapt to Go backend response structure: provisioning_url and secret
      const { provisioning_url, secret } = response.data;

      if (provisioning_url && secret) { // Check for both fields
        setQrCodeUrl(provisioning_url); // Set the renamed state variable
        setSecret(secret);
        setSuccess("2FA Setup erfolgreich. Scannen Sie den QR-Code und verifizieren Sie ihn.");
      } else {
        setError("Fehler beim Starten des 2FA-Setups: Ungültige Antwort vom Server."); // More specific error
      }
    } catch (err) {
      console.error("2FA Setup failed:", err.response?.data || err.message);
      // Adapt error handling to Go backend error response structure { error: "message" }
      setError(err.response?.data?.error || "2FA Setup failed.");
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Zwei-Faktor-Authentifizierung einrichten
        </Typography>
        <Paper elevation={2} sx={{ p: 3 }}>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

          {!qrCodeUrl ? ( // Use the renamed state variable
            <>
              <Typography variant="body1" gutterBottom>
                Klicken Sie auf 'Setup starten', um Ihren 2FA QR-Code zu generieren.
              </Typography>
              {/* Removed password input field */}
              {/* Removed password state and input */}
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
                {/* Note: Use qrCodeUrl state variable */}
                <img src={qrCodeUrl} alt="2FA QR Code" style={{ maxWidth: '200px', height: 'auto' }} />
              </Box>
              <Typography variant="body2" align="center" gutterBottom>
                Oder geben Sie diesen geheimen Schlüssel manuell ein: <strong>{secret}</strong>
              </Typography>
              {/* Button to navigate to verification page */}
              <Button variant="outlined" onClick={() => navigate('/two-factor-verify')} sx={{ mt: 2 }}>
                Code verifizieren
              </Button>
            </>
          )}
        </Paper>
      </Box>
    </Container>
  );
};

export default TwoFactorSetupPage; 