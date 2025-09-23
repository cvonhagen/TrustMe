import React, { useState } from 'react';
import { Container, Typography, Box, Paper, Button, Dialog, DialogTitle, DialogContent, DialogActions, Alert, TextField } from '@mui/material';
import Footer from '../components/Footer';
import { useAuth } from '../AuthContext';
import api, { restoreAccount } from '../services/api';

// SettingsPage-Komponente für die Benutzer-Einstellungen.
const SettingsPage = () => {
  const { logout } = useAuth();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteResult, setDeleteResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [restoreLoading, setRestoreLoading] = useState(false);
  const [restoreCredentials, setRestoreCredentials] = useState({ username: '', password: '' });

  const handleDeleteAccount = async () => {
    setLoading(true);
    try {
      const response = await api.delete('/api/v1/auth/account');
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
  
  const handleRestoreAccount = async () => {
    setRestoreLoading(true);
    try {
      const response = await restoreAccount(restoreCredentials);
      setDeleteResult({
        type: 'success',
        message: response.data.message || 'Account wurde erfolgreich wiederhergestellt!'
      });
      setRestoreDialogOpen(false);
      setRestoreCredentials({ username: '', password: '' });
    } catch (error) {
      setDeleteResult({
        type: 'error',
        message: error.response?.data?.error || 'Fehler bei der Wiederherstellung des Accounts'
      });
    }
    setRestoreLoading(false);
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
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Button 
            variant="outlined" 
            color="error" 
            onClick={() => setDeleteDialogOpen(true)}
            sx={{ mt: 1 }}
          >
            Account löschen
          </Button>
          <Button 
            variant="outlined" 
            color="primary" 
            onClick={() => setRestoreDialogOpen(true)}
            sx={{ mt: 1 }}
          >
            Account wiederherstellen
          </Button>
        </Box>
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
      
      {/* Account-Wiederherstellungs-Dialog */}
      <Dialog open={restoreDialogOpen} onClose={() => setRestoreDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ color: 'primary.main' }}>Account wiederherstellen?</DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            Geben Sie Ihre Anmeldedaten ein, um Ihren gelöschten Account wiederherzustellen:
          </Typography>
          <Alert severity="info" sx={{ mt: 2, mb: 2 }}>
            <Typography variant="body2">
              <strong>Hinweis:</strong> Ihr Account wurde für die Löschung markiert, kann aber innerhalb von 
              <strong> 30 Tagen wiederhergestellt</strong> werden. Alle Ihre Daten sind noch vorhanden 
              und werden bei der Wiederherstellung vollständig zurückgegeben.
            </Typography>
          </Alert>
          
          <TextField
            autoFocus
            margin="dense"
            label="Benutzername"
            type="text"
            fullWidth
            variant="outlined"
            value={restoreCredentials.username}
            onChange={(e) => setRestoreCredentials(prev => ({ ...prev, username: e.target.value }))}
            sx={{ mb: 2 }}
          />
          
          <TextField
            margin="dense"
            label="Passwort"
            type="password"
            fullWidth
            variant="outlined"
            value={restoreCredentials.password}
            onChange={(e) => setRestoreCredentials(prev => ({ ...prev, password: e.target.value }))}
          />
          
          <Typography variant="body2" sx={{ mt: 2, fontWeight: 'bold' }}>
            Das wird wiederhergestellt:
          </Typography>
          <Typography variant="body2" component="ul" sx={{ mt: 1 }}>
            <li>Alle gespeicherten Passwörter</li>
            <li>Ihr Benutzerprofil</li>
            <li>Alle Notizen und Einstellungen</li>
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setRestoreDialogOpen(false);
            setRestoreCredentials({ username: '', password: '' });
          }}>Abbrechen</Button>
          <Button 
            color="primary" 
            variant="contained"
            onClick={handleRestoreAccount}
            disabled={restoreLoading || !restoreCredentials.username || !restoreCredentials.password}
          >
            {restoreLoading ? 'Stelle wieder her...' : 'Account wiederherstellen'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
    <Footer />
    </>
  );
};

export default SettingsPage; 