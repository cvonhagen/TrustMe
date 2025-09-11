import React, { useState, useEffect } from 'react';
import { Container, Typography, Box, Paper, Alert, Button, CircularProgress } from '@mui/material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { verifyEmail, resendVerificationEmail } from '../services/api';
import Footer from '../components/Footer';

// VerifyEmailPage-Komponente für die E-Mail-Verifizierung
function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [resendLoading, setResendLoading] = useState(false);
  const navigate = useNavigate();

  const token = searchParams.get('token');

  useEffect(() => {
    if (token) {
      handleVerifyEmail(token);
    }
  }, [token]);

  const handleVerifyEmail = async (verificationToken) => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await verifyEmail({ token: verificationToken });
      setSuccess('E-Mail erfolgreich verifiziert! Sie können sich jetzt anmelden.');
      // Nach 3 Sekunden zum Login weiterleiten
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Verifizierung fehlgeschlagen. Der Link könnte abgelaufen oder ungültig sein.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    const email = prompt('Bitte geben Sie Ihre E-Mail-Adresse ein:');
    if (!email) return;

    setResendLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await resendVerificationEmail({ email });
      setSuccess('Verifizierungs-E-Mail wurde erneut gesendet. Bitte überprüfen Sie Ihr Postfach.');
    } catch (err) {
      setError(err.response?.data?.error || 'Fehler beim Senden der E-Mail.');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <>
      <Container 
        component="main" 
        maxWidth="sm" 
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
          <Typography component="h1" variant="h5" sx={{ mb: 3 }}>
            E-Mail-Verifizierung
          </Typography>

          {loading && (
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <CircularProgress size={24} sx={{ mr: 2 }} />
              <Typography>Verifiziere E-Mail-Adresse...</Typography>
            </Box>
          )}

          {error && (
            <Alert severity="error" sx={{ mb: 3, width: '100%' }}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 3, width: '100%' }}>
              {success}
            </Alert>
          )}

          {!token && !loading && (
            <Typography variant="body1" sx={{ mb: 3, textAlign: 'center' }}>
              Kein Verifizierungstoken gefunden. Bitte klicken Sie auf den Link in Ihrer E-Mail oder fordern Sie eine neue Verifizierungs-E-Mail an.
            </Typography>
          )}

          {(error || !token) && (
            <Box sx={{ display: 'flex', gap: 2, flexDirection: 'column', width: '100%' }}>
              <Button
                variant="contained"
                onClick={handleResendVerification}
                disabled={resendLoading}
                fullWidth
              >
                {resendLoading ? 'Sende...' : 'Verifizierungs-E-Mail erneut senden'}
              </Button>
              
              <Button
                variant="outlined"
                onClick={() => navigate('/login')}
                fullWidth
              >
                Zum Login
              </Button>
            </Box>
          )}

          {success && (
            <Typography variant="body2" sx={{ mt: 2, textAlign: 'center', color: 'text.secondary' }}>
              Sie werden automatisch zum Login weitergeleitet...
            </Typography>
          )}
        </Paper>
      </Container>
      <Footer />
    </>
  );
}

export default VerifyEmailPage;
