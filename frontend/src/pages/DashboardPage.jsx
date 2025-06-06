import React, { useState, useEffect, useContext } from 'react';
import { Container, Typography, List, ListItem, ListItemText, Paper, Box, Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions, IconButton, Alert } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { getPasswords, createPassword, updatePassword, deletePassword } from '../services/api';
import { decryptData, encryptData } from '../utils/crypto';
import { useAuth } from '../AuthContext';

const DashboardPage = () => {
  const [passwords, setPasswords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [openDetailDialog, setOpenDetailDialog] = useState(false);
  const [currentPassword, setCurrentPassword] = useState(null);

  const [openFormDialog, setOpenFormDialog] = useState(false);
  const [formData, setFormData] = useState({
    website_url: '',
    username: '',
    password: '',
    notes: '',
  });
  const [isEditing, setIsEditing] = useState(false);
  const [formError, setFormError] = useState(null);

  // State for Delete Confirmation Dialog
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
  const [passwordToDelete, setPasswordToDelete] = useState(null);

  const { encryptionKey } = useAuth();

  // Function to fetch and decrypt passwords
  const fetchAndDecryptPasswords = async () => {
    if (!encryptionKey) {
      setError("Encryption key not available. Please log in again.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await getPasswords();
      const encryptedPasswords = response.data;

      const decryptedPasswords = encryptedPasswords.map(pw => {
        try {
          const decryptedUsername = decryptData(pw.encrypted_username, pw.username_iv, pw.username_tag, encryptionKey);
          const decryptedPassword = decryptData(pw.encrypted_password, pw.password_iv, pw.password_tag, encryptionKey);
          const decryptedNotes = pw.encrypted_notes ? decryptData(pw.encrypted_notes, pw.notes_iv, pw.notes_tag, encryptionKey) : '';
          
          return {
            ...pw,
            username: decryptedUsername,
            password: decryptedPassword,
            notes: decryptedNotes
          };
        } catch (decryptError) {
          console.error("Error decrypting password:", decryptError);
          return { 
            ...pw, 
            website_url: pw.website_url + " [Decryption Error]",
            username: "[Decryption Error]", 
            password: "[Decryption Error]", 
            notes: "[Decryption Error]"
          };
        }
      });

      setPasswords(decryptedPasswords);
    } catch (err) {
      console.error("Failed to fetch passwords:", err.response?.data || err.message);
      setError(err.response?.data?.error || "Failed to load passwords.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch passwords on component mount or when encryptionKey changes
  useEffect(() => {
    fetchAndDecryptPasswords();
  }, [encryptionKey]); // Refetch if encryptionKey changes

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const handlePasswordClick = (password) => {
    setCurrentPassword(password);
    setOpenDetailDialog(true);
  };

  const handleCloseDetailDialog = () => {
    setOpenDetailDialog(false);
    setCurrentPassword(null);
  };

  const handleAddPassword = () => {
    setFormData({
      website_url: '',
      username: '',
      password: '',
      notes: '',
    });
    setIsEditing(false);
    setFormError(null);
    setOpenFormDialog(true);
  };

  const handleEditPassword = (password) => {
    setFormData({
      website_url: password.website_url,
      username: password.username,
      password: password.password,
      notes: password.notes || '',
    });
    setCurrentPassword(password); // Keep track of the original password for ID
    setIsEditing(true);
    setFormError(null);
    setOpenDetailDialog(false); // Close detail dialog
    setOpenFormDialog(true);
  };

  const handleCloseFormDialog = () => {
    setOpenFormDialog(false);
    setFormData({
      website_url: '',
      username: '',
      password: '',
      notes: '',
    });
    setCurrentPassword(null); // Clear current password context
    setIsEditing(false);
    setFormError(null);
  };

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setFormData(prevFormData => ({
      ...prevFormData,
      [name]: value
    }));
  };

  // Save Password logic (Add or Edit)
  const handleSavePassword = async () => {
    setFormError(null);
    if (!encryptionKey) {
      setFormError("Encryption key not available. Cannot save password.");
      return;
    }

    try {
      // Encrypt sensitive data before sending to backend
      const encryptedUsernameData = encryptData(formData.username, encryptionKey);
      const encryptedPasswordData = encryptData(formData.password, encryptionKey);
      const encryptedNotesData = formData.notes ? encryptData(formData.notes, encryptionKey) : { encryptedData: '', iv: '', tag: '' }; // Handle empty notes

      const passwordDataToSend = {
        website_url: formData.website_url,
        encrypted_username: encryptedUsernameData.encryptedData,
        username_iv: encryptedUsernameData.iv,
        username_tag: encryptedUsernameData.tag,
        encrypted_password: encryptedPasswordData.encryptedData,
        password_iv: encryptedPasswordData.iv,
        password_tag: encryptedPasswordData.tag,
        encrypted_notes: encryptedNotesData.encryptedData,
        notes_iv: encryptedNotesData.iv,
        notes_tag: encryptedNotesData.tag,
      };

      if (isEditing && currentPassword) {
        await updatePassword(currentPassword.id, passwordDataToSend);
      } else {
        await createPassword(passwordDataToSend);
      }

      handleCloseFormDialog();
      fetchAndDecryptPasswords(); // Refresh list after saving

    } catch (err) {
      console.error("Failed to save password:", err.response?.data || err.message);
      setFormError(err.response?.data?.error || 'Fehler beim Speichern des Passworts.');
    }
  };

  // Open Delete Confirmation Dialog
  const handleDeleteClick = (password) => {
    setPasswordToDelete(password);
    setOpenConfirmDialog(true);
  };

  // Close Delete Confirmation Dialog
  const handleCloseConfirmDialog = () => {
    setOpenConfirmDialog(false);
    setPasswordToDelete(null);
  };

  // Delete Password logic
  const handleDeletePassword = async () => {
    setFormError(null); // Use formError state for consistency, or add a new deleteError state
    if (!passwordToDelete) return; // Should not happen if dialog is opened correctly

    try {
      await deletePassword(passwordToDelete.id);
      handleCloseConfirmDialog();
      fetchAndDecryptPasswords(); // Refresh list after deletion
    } catch (err) {
      console.error("Failed to delete password:", err.response?.data || err.message);
      // Display error to the user, perhaps in the confirm dialog or as a general error
      setFormError(err.response?.data?.error || 'Fehler beim Löschen des Passworts.');
      // Keep the confirm dialog open to show the error
    }
  };

  const filteredPasswords = passwords.filter(pw =>
    (pw.website_url && pw.website_url.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (pw.username && pw.username.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (pw.notes && pw.notes.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return <Typography>Lade Passwörter...</Typography>;
  }

  if (error) {
    return <Typography color="error">{error}</Typography>;
  }

  return (
    <Container maxWidth="md">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Deine Passwörter
        </Typography>
        <TextField
          label="Passwörter suchen"
          variant="outlined"
          fullWidth
          margin="normal"
          value={searchTerm}
          onChange={handleSearchChange}
        />
        <Button variant="contained" color="primary" onClick={handleAddPassword} sx={{ mt: 2 }}>
          Passwort hinzufügen
        </Button>
        <Paper elevation={2} sx={{ mt: 2 }}>
          <List>
            {filteredPasswords.map(password => (
              <ListItem
                key={password.id} 
                secondaryAction={
                  <>
                    <IconButton edge="end" aria-label="edit" onClick={(e) => { e.stopPropagation(); handleEditPassword(password); }}>
                      <EditIcon />
                    </IconButton>
                    {/* Call handleDeleteClick to open confirmation dialog */}
                    <IconButton edge="end" aria-label="delete" onClick={(e) => { e.stopPropagation(); handleDeleteClick(password); }}>
                      <DeleteIcon />
                    </IconButton>
                  </>
                }
                onClick={() => handlePasswordClick(password)}
                button
              >
                <ListItemText primary={password.website_url} secondary={password.username || '--'} />
              </ListItem>
            ))}
          </List>
        </Paper>

        {/* Password Detail Dialog */}
        <Dialog open={openDetailDialog} onClose={handleCloseDetailDialog}>
          <DialogTitle>{currentPassword?.website_url}</DialogTitle>
          <DialogContent>
            <Typography><b>Benutzername:</b> {currentPassword?.username}</Typography>
            <Typography><b>Passwort:</b> {currentPassword?.password}</Typography>
            <Typography><b>Notizen:</b> {currentPassword?.notes || 'Keine Notizen'}</Typography>
          </DialogContent>
          <DialogActions>
             {/* Buttons in detail view */}
             <Button onClick={() => { handleEditPassword(currentPassword); }}>Bearbeiten</Button>
             {/* Call handleDeleteClick from detail view */}
            <Button onClick={() => { handleDeleteClick(currentPassword); handleCloseDetailDialog(); }}>Löschen</Button>
            <Button onClick={handleCloseDetailDialog}>Schließen</Button>
          </DialogActions>
        </Dialog>

        {/* Add/Edit Password Form Dialog */}
        <Dialog open={openFormDialog} onClose={handleCloseFormDialog}>
          <DialogTitle>{isEditing ? 'Passwort bearbeiten' : 'Passwort hinzufügen'}</DialogTitle>
          <DialogContent>
            {formError && <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>}
            <TextField
              autoFocus
              margin="dense"
              label="Website URL"
              type="text"
              fullWidth
              variant="outlined"
              name="website_url"
              value={formData.website_url}
              onChange={handleFormChange}
            />
            <TextField
              margin="dense"
              label="Benutzername"
              type="text"
              fullWidth
              variant="outlined"
              name="username"
              value={formData.username}
              onChange={handleFormChange}
            />
            <TextField
              margin="dense"
              label="Passwort"
              type="password"
              fullWidth
              variant="outlined"
              name="password"
              value={formData.password}
              onChange={handleFormChange}
            />
             <TextField
              margin="dense"
              label="Notizen (Optional)"
              type="text"
              fullWidth
              variant="outlined"
              name="notes"
              value={formData.notes}
              onChange={handleFormChange}
              multiline
              rows={4}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseFormDialog}>Abbrechen</Button>
            <Button onClick={handleSavePassword} variant="contained">Speichern</Button>
          </DialogActions>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={openConfirmDialog}
          onClose={handleCloseConfirmDialog}
          aria-labelledby="alert-dialog-title"
          aria-describedby="alert-dialog-description"
        >
          <DialogTitle id="alert-dialog-title">
            Passwort löschen bestätigen?
          </DialogTitle>
          <DialogContent>
            {formError && <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>}
            <Typography id="alert-dialog-description">
              Sind Sie sicher, dass Sie den Passwort-Eintrag für <strong>{passwordToDelete?.website_url}</strong> löschen möchten?
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseConfirmDialog}>Abbrechen</Button>
            <Button onClick={handleDeletePassword} variant="contained" color="error" autoFocus>
              Löschen
            </Button>
          </DialogActions>
        </Dialog>

      </Box>
    </Container>
  );
};

export default DashboardPage; 