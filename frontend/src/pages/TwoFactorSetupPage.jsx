import React, { useState, useEffect } from 'react';
import { Container, Typography, Box, TextField, Button, Alert, Paper } from '@mui/material';
import { setupTwoFactor, verifyTwoFactorSetup } from '../services/api';
import { useNavigate } from 'react-router-dom';

function TwoFactorSetupPage() {
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSetupDetails = async () => {
      try {
        // Call the backend endpoint to initiate 2FA setup
        const response = await setupTwoFactor();
        setQrCodeUrl(response.data.qr_code_url);
        setLoading(false);
      } catch (err) {
        console.error("Failed to fetch 2FA setup details:", err);
        setError('Fehler beim Laden der 2FA-Setup-Details.');
        setLoading(false);
      }
    };

    fetchSetupDetails();
  }, []);

  const handleCodeChange = (event) => {
    setCode(event.target.value);
  };

  const handleVerifySetup = async () => {
    setError(null);
    try {
      // Call the backend endpoint to verify the setup code
      await verifyTwoFactorSetup({ code });
      // If successful, navigate to the dashboard or a success page
      navigate('/dashboard'); // Or a confirmation page
    } catch (err) {
      console.error("Failed to verify 2FA setup:", err);
      setError(err.response?.data?.detail || 'Verifizierung fehlgeschlagen. Bitte überprüfen Sie den Code.');
    }
  };

  if (loading) {
    return (
      <Container component="main" maxWidth="sm" sx={{ mt: 8, textAlign: 'center' }}>
        <Typography variant="h6">Laden der 2FA-Setup-Details...</Typography>
      </Container>
    );
  }

  if (error && !qrCodeUrl) { // Display initial errors if QR code couldn't be fetched
     return (
      <Container component="main" maxWidth="sm" sx={{ mt: 8 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container component="main" maxWidth="sm" sx={{ mt: 8 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography component="h1" variant="h5" align="center" gutterBottom>
          2-Faktor-Authentifizierung einrichten
        </Typography>
        <Typography variant="body1" paragraph>
          Scannen Sie den folgenden QR-Code mit Ihrer Authenticator-App (z. B. Google Authenticator, Authy).
        </Typography>

        {qrCodeUrl && (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
            {/* In a real app, you would use a library to render the QR code from qrCodeUrl */}
            {/* For now, we'll just display the URL as an image source (might not render directly depending on URL type) */}
            {/* A better approach is to use a library like 'qrcode.react' */}
            <img src={qrCodeUrl} alt="2FA QR Code" style={{ maxWidth: '200px', height: 'auto' }} />
          </Box>
        )}

        <Typography variant="body1" paragraph>
          Geben Sie den Code aus Ihrer Authenticator-App ein, um die Einrichtung abzuschließen.
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
          onClick={handleVerifySetup}
        >
          Einrichtung abschließen
        </Button>
      </Paper>
    </Container>
  );
}

export default TwoFactorSetupPage; 