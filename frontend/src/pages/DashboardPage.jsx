import React, { useState, useEffect } from 'react';
import { Container, Typography, Box, CircularProgress, Alert, Paper, TableContainer, Table, TableHead, TableRow, TableCell, TableBody, IconButton, Button, Dialog, DialogTitle, DialogContent, TextField, DialogActions } from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { getPasswords, addPassword, updatePassword, deletePassword } from '../services/api';
import { decryptData, encryptData } from '../utils/crypto';
import { useAuth } from '../AuthContext';

function DashboardPage() {
  const [passwords, setPasswords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [currentPassword, setCurrentPassword] = useState(null);
  const [formData, setFormData] = useState({
    website_url: '',
    username: '',
    password: '',
    notes: '',
  });

  const { encryptionKey } = useAuth();

  useEffect(() => {
    const fetchPasswords = async () => {
      if (!encryptionKey) {
        setError('Verschlüsselungsschlüssel nicht verfügbar. Bitte melden Sie sich erneut an.');
        setLoading(false);
        return;
      }

      try {
        const response = await getPasswords();
        const encryptedPasswords = response.data;

        const decryptedPasswords = encryptedPasswords.map(p => {
          try {
            const decryptedUsername = decryptData(p.encrypted_username, encryptionKey);
            const decryptedPassword = decryptData(p.encrypted_password, encryptionKey);
            const decryptedNotes = p.encrypted_notes ? decryptData(p.encrypted_notes, encryptionKey) : '';
            return {
              ...p,
              decryptedUsername,
              decryptedPassword,
              decryptedNotes,
            };
          } catch (decryptError) {
            console.error(`Failed to decrypt password ID ${p.id}: `, decryptError);
            return { ...p, decryptedUsername: 'Decryption Failed', decryptedPassword: 'Decryption Failed', decryptedNotes: 'Decryption Failed' };
          }
        });

        setPasswords(decryptedPasswords);
        setLoading(false);
      } catch (err) {
        console.error("Failed to fetch passwords:", err);
        setError('Passwörter konnten nicht geladen werden.');
        setLoading(false);
      }
    };

    fetchPasswords();
  }, [encryptionKey]);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleAddPassword = () => {
    setCurrentPassword(null);
    setFormData({ website_url: '', username: '', password: '', notes: '' });
    setOpenDialog(true);
  };

  const handleEditPassword = (password) => {
    setCurrentPassword(password);
    setFormData({
      website_url: password.website_url,
      username: password.decryptedUsername,
      password: password.decryptedPassword,
      notes: password.decryptedNotes,
    });
    setOpenDialog(true);
  };

  const handleDeletePassword = async (passwordId) => {
    if (window.confirm('Sind Sie sicher, dass Sie dieses Passwort löschen möchten?')) {
      try {
        await deletePassword(passwordId);
        setPasswords(passwords.filter(p => p.id !== passwordId));
        console.log(`Password with ID ${passwordId} deleted.`);
      } catch (err) {
        console.error("Failed to delete password:", err);
        setError('Passwort konnte nicht gelöscht werden.');
      }
    }
  };

  const handleSavePassword = async () => {
    if (!encryptionKey) {
      setError('Verschlüsselungsschlüssel nicht verfügbar. Bitte melden Sie sich erneut an, um Passwörter zu speichern.');
      return;
    }

    try {
      const encryptedUsername = encryptData(formData.username, encryptionKey);
      const encryptedPassword = encryptData(formData.password, encryptionKey);
      const encryptedNotes = formData.notes ? encryptData(formData.notes, encryptionKey) : '';

      const passwordData = {
        website_url: formData.website_url,
        encrypted_username: encryptedUsername,
        encrypted_password: encryptedPassword,
        encrypted_notes: encryptedNotes,
      };

      if (currentPassword) {
        await updatePassword(currentPassword.id, passwordData);
        setPasswords(passwords.map(p => p.id === currentPassword.id ? {
          ...p,
          website_url: formData.website_url,
          decryptedUsername: formData.username,
          decryptedPassword: formData.password,
          decryptedNotes: formData.notes,
        } : p));
        console.log(`Password with ID ${currentPassword.id} updated.`);
      } else {
        const newPassword = await addPassword(passwordData);
        setLoading(true);
        setError(null);

        console.log('New password added.', newPassword);
      }

      setOpenDialog(false);
      setFormData({ website_url: '', username: '', password: '', notes: '' });
    } catch (err) {
      console.error("Failed to save password:", err);
      setError('Passwort konnte nicht gespeichert werden.');
    }
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCurrentPassword(null);
    setFormData({ website_url: '', username: '', password: '', notes: '' });
    setError(null);
  };

  if (loading) {
    return (
      <Container component="main" maxWidth="md" sx={{ mt: 8, textAlign: 'center' }}>
        <CircularProgress />
        <Typography variant="h6">Laden...</Typography>
      </Container>
    );
  }

  if (error && !openDialog) {
    return (
      <Container component="main" maxWidth="md" sx={{ mt: 8 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container component="main" maxWidth="md" sx={{ mt: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography component="h1" variant="h5">Passwörter</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleAddPassword}>
          Passwort hinzufügen
        </Button>
      </Box>

      {error && openDialog && (
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
      )}

      {passwords.length === 0 ? (
        <Typography variant="body1">Noch keine Passwörter vorhanden.</Typography>
      ) : (
        <TableContainer component={Paper}>
          <Table sx={{ minWidth: 650 }} aria-label="password table">
            <TableHead>
              <TableRow>
                <TableCell>Webseite</TableCell>
                <TableCell>Benutzername</TableCell>
                <TableCell>Passwort</TableCell>
                <TableCell>Notizen</TableCell>
                <TableCell align="right">Aktionen</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {passwords.map((password) => (
                <TableRow key={password.id}>
                  <TableCell component="th" scope="row">
                    {password.website_url}
                  </TableCell>
                  <TableCell>{password.decryptedUsername}</TableCell>
                  <TableCell>{password.decryptedPassword}</TableCell>
                  <TableCell>{password.decryptedNotes}</TableCell>
                  <TableCell align="right">
                    <IconButton onClick={() => handleEditPassword(password)} color="primary">
                      <EditIcon />
                    </IconButton>
                    <IconButton onClick={() => handleDeletePassword(password.id)} color="error">
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>{currentPassword ? 'Passwort bearbeiten' : 'Passwort hinzufügen'}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            name="website_url"
            label="Webseite URL"
            type="text"
            fullWidth
            variant="standard"
            value={formData.website_url}
            onChange={handleInputChange}
          />
          <TextField
            margin="dense"
            name="username"
            label="Benutzername"
            type="text"
            fullWidth
            variant="standard"
            value={formData.username}
            onChange={handleInputChange}
          />
          <TextField
            margin="dense"
            name="password"
            label="Passwort"
            type="password"
            fullWidth
            variant="standard"
            value={formData.password}
            onChange={handleInputChange}
          />
          <TextField
            margin="dense"
            name="notes"
            label="Notizen"
            type="text"
            fullWidth
            multiline
            rows={2}
            variant="standard"
            value={formData.notes}
            onChange={handleInputChange}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Abbrechen</Button>
          <Button onClick={handleSavePassword}>{currentPassword ? 'Speichern' : 'Hinzufügen'}</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default DashboardPage; 