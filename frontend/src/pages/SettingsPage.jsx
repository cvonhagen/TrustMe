import React from 'react';
import { Container, Typography, Box, Paper } from '@mui/material';
import Footer from '../components/Footer';

// SettingsPage-Komponente für die Benutzer-Einstellungen.
const SettingsPage = () => {
  return (
    <>
    <Container maxWidth="md" sx={{ mt: 4, mb: 4, paddingBottom: '100px' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Einstellungen
        </Typography>
      </Box>

      <Paper elevation={2} sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Kontoeinstellungen
        </Typography>
        <Typography variant="body1" sx={{ mb: 2 }}>
          Hier können Sie Ihre Kontoinformationen verwalten.
          (Zukünftige Funktionen: Passwort ändern, E-Mail ändern, Profil löschen)
        </Typography>
        
        <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
          Sicherheitseinstellungen
        </Typography>
        <Typography variant="body1" sx={{ mb: 2 }}>
          Verwalten Sie hier die Sicherheitsoptionen für Ihr Konto.
          (Zukünftige Funktionen: 2FA-Status verwalten, Sitzungen beenden)
        </Typography>
        
        <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
          Design-Einstellungen
        </Typography>
        <Typography variant="body1" sx={{ mb: 2 }}>
          Passen Sie das Erscheinungsbild der Anwendung an.
          (Zukünftige Funktionen: Theme-Auswahl)
        </Typography>
      </Paper>
    </Container>
    <Footer />
    </>
  );
};

export default SettingsPage; 