import React, { useState } from 'react';
import { Container, Typography, Box, Paper, Button, Dialog, DialogTitle, DialogContent, DialogActions, Alert } from '@mui/material';
import Footer from '../components/Footer';
import { useAuth } from '../AuthContext';
import api from '../services/api';

// SettingsPage-Komponente für die Benutzer-Einstellungen.
const SettingsPage = () => {
  const { logout } = useAuth();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteResult, setDeleteResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleDeleteAccount = async () => {
    setLoading(true);
    try {
      const response = await api.delete('/api/v1/users/account');
      setDeleteResult({
        type: 'success',
        message: response.data.message
      });
      setDeleteConfirmOpen(false);
      setDeleteDialogOpen(false);
      
      // Nach 3 Sekunden automatisch ausloggen
      setTimeout(() => {
        logout();
      }, 3000);
    } catch (error) {
      setDeleteResult({
        type: 'error',
        message: error.response?.data?.error || 'Fehler beim Löschen des Accounts'
      });
    }
    setLoading(false);
  };
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
        
        <Typography variant="h6" gutterBottom sx={{ mt: 4, color: 'error.main' }}>
          Gefährlicher Bereich
        </Typography>
        <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
          Account-Löschung ist permanent und kann nicht rückgängig gemacht werden.
        </Typography>
        <Button 
          variant="outlined" 
          color="error" 
          onClick={() => setDeleteDialogOpen(true)}
          sx={{ mt: 1 }}
        >
          Account löschen
        </Button>
      </Paper>
      
      {/* Erfolgsmeldung oder Fehlermeldung */}
      {deleteResult && (
        <Alert 
          severity={deleteResult.type} 
          onClose={() => setDeleteResult(null)}
          sx={{ mt: 2 }}
        >
          {deleteResult.message}
        </Alert>
      )}
      
      {/* Bestätigungsdialog für Account-Löschung */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ color: 'error.main' }}>Account löschen?</DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            Sind Sie sicher, dass Sie Ihren Account löschen möchten?
          </Typography>
          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="body2">
              <strong>Wichtiger Hinweis:</strong> Ihr Account wird für die Löschung markiert, aber Ihre Daten werden noch 
              <strong> 30 Tage lang sicher gespeichert</strong>. Während dieser Zeit können Sie Ihren Account 
              jederzeit wiederherstellen. Nach 30 Tagen werden alle Daten endgültig und unwiederruflich gelöscht.
            </Typography>
          </Alert>
          <Typography variant="body2" sx={{ mt: 2, fontWeight: 'bold' }}>
            Diese Aktion betrifft:
          </Typography>
          <Typography variant="body2" component="ul" sx={{ mt: 1 }}>
            <li>Alle gespeicherten Passwörter</li>
            <li>Ihr Benutzerprofil</li>
            <li>Alle Notizen und Einstellungen</li>
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Abbrechen</Button>
          <Button 
            color="error" 
            variant="contained"
            onClick={() => {
              setDeleteDialogOpen(false);
              setDeleteConfirmOpen(true);
            }}
          >
            Weiter
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Finale Bestätigung */}
      <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ color: 'error.main' }}>Letzte Bestätigung</DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            Dies ist Ihre letzte Chance! Sind Sie absolut sicher?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)}>Nein, zurück</Button>
          <Button 
            color="error" 
            variant="contained"
            onClick={handleDeleteAccount}
            disabled={loading}
          >
            {loading ? 'Lösche...' : 'Ja, Account löschen'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
    <Footer />
    </>
  );
};

export default SettingsPage; 