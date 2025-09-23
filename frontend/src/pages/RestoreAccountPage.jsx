import React, { useState } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Paper, 
  TextField, 
  Button, 
  Alert,
  Card,
  CardContent
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import Footer from '../components/Footer';
import { restoreAccount } from '../services/api';

const RestoreAccountPage = () => {
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const response = await restoreAccount(credentials);
      setResult({
        type: 'success',
        message: response.data.message || 'Account wurde erfolgreich wiederhergestellt!'
      });
      
      // Nach 3 Sekunden zur Login-Seite weiterleiten
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (error) {
      setResult({
        type: 'error',
        message: error.response?.data?.error || 'Fehler bei der Wiederherstellung des Accounts'
      });
    }
    setLoading(false);
  };

  const handleInputChange = (field) => (e) => {
    setCredentials(prev => ({ ...prev, [field]: e.target.value }));
  };

  return (
    <>
      <Container maxWidth="sm" sx={{ mt: 8, mb: 4, paddingBottom: '100px' }}>
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography variant="h3" component="h1" gutterBottom>
            TrustMe
          </Typography>
          <Typography variant="h5" component="h2" color="primary" gutterBottom>
            Account wiederherstellen
          </Typography>
        </Box>

        <Paper elevation={3} sx={{ p: 4 }}>
          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="body2">
              <strong>Hinweis:</strong> Ihr Account wurde zur Löschung markiert, kann aber innerhalb von 
              <strong> 30 Tagen wiederhergestellt</strong> werden. Geben Sie Ihre ursprünglichen 
              Anmeldedaten ein, um den Account zu reaktivieren.
            </Typography>
          </Alert>

          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Benutzername"
              variant="outlined"
              margin="normal"
              required
              value={credentials.username}
              onChange={handleInputChange('username')}
              disabled={loading}
            />
            
            <TextField
              fullWidth
              label="Master-Passwort"
              type="password"
              variant="outlined"
              margin="normal"
              required
              value={credentials.password}
              onChange={handleInputChange('password')}
              disabled={loading}
              helperText="Ihr ursprüngliches Master-Passwort"
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading || !credentials.username || !credentials.password}
              sx={{ mt: 3, mb: 2 }}
            >
              {loading ? 'Stelle wieder her...' : 'Account wiederherstellen'}
            </Button>
          </form>

          {result && (
            <Alert 
              severity={result.type} 
              sx={{ mt: 2 }}
              onClose={() => setResult(null)}
            >
              {result.message}
              {result.type === 'success' && (
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Sie werden automatisch zur Anmeldung weitergeleitet...
                </Typography>
              )}
            </Alert>
          )}

          <Card sx={{ mt: 3, bgcolor: 'background.default' }}>
            <CardContent>
              <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
                Was wird wiederhergestellt:
              </Typography>
              <Typography variant="body2" component="ul" sx={{ m: 0, pl: 2 }}>
                <li>Alle gespeicherten Passwörter</li>
                <li>Ihr Benutzerprofil</li>
                <li>Alle Notizen und Einstellungen</li>
                <li>Ihre 2FA-Konfiguration (falls aktiviert)</li>
              </Typography>
            </CardContent>
          </Card>

          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Button 
              color="primary" 
              onClick={() => navigate('/login')}
              disabled={loading}
            >
              Zurück zur Anmeldung
            </Button>
          </Box>
        </Paper>
      </Container>
      <Footer />
    </>
  );
};

export default RestoreAccountPage;