import React, { useState, useEffect, useContext } from 'react';
import { Container, Typography, Paper, Box, Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions, IconButton, Alert, TableContainer, Table, TableHead, TableBody, TableRow, TableCell } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import { getPasswords, createPassword, updatePassword, deletePassword } from '../services/api';
import { decryptData, encryptData, generatePassword } from '../utils/crypto';
import { useAuth } from '../AuthContext';
import { useThemeContext } from '../ThemeContext';

// DashboardPage ist die Hauptkomponente für die Passwortverwaltung.
// Sie zeigt Passwörter an, ermöglicht das Hinzufügen, Bearbeiten und Löschen.
const DashboardPage = () => {
  const [passwords, setPasswords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [openDetailDialog, setOpenDetailDialog] = useState(false);
  const [currentPassword, setCurrentPassword] = useState(null);
  const [generatedPassword, setGeneratedPassword] = useState('');
  
  // Funktion zum Generieren eines sicheren Passworts
  const generatePassword = () => {
    const length = 16;
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';
    let password = '';
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * charset.length);
      password += charset[randomIndex];
    }
    setGeneratedPassword(password);
    setFormData(prev => ({ ...prev, password: password }));
  };

  const [openFormDialog, setOpenFormDialog] = useState(false);   // Zustand für das Formular-Dialogfeld (Hinzufügen/Bearbeiten)
  const [formData, setFormData] = useState({                  // Zustand für die Formulardaten
    website_url: '',
    username: '',
    password: '',
    notes: '',
  });
  const [isEditing, setIsEditing] = useState(false);            // Zustand, ob der Bearbeitungsmodus aktiv ist
  const [formError, setFormError] = useState(null);             // Zustand für Fehler im Formular

  // Zustände für das Bestätigungsdialogfeld zum Löschen
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
  const [passwordToDelete, setPasswordToDelete] = useState(null);

  // Authentifizierungs- und Theme-Kontext abrufen
  const { encryptionKey, isAuthenticated, loadingAuth } = useAuth();
  const { toggleColorMode, mode } = useThemeContext();

  // Neuer Zustand, um zu verfolgen, welche Passwörter sichtbar sind (Map: passwordId -> boolean)
  const [visiblePasswords, setVisiblePasswords] = useState({});

  // togglePasswordVisibility schaltet die Sichtbarkeit eines Passworts um.
  const togglePasswordVisibility = (passwordId) => {
    setVisiblePasswords(prevState => ({
      ...prevState,
      [passwordId]: !prevState[passwordId]
    }));
  };

  // fetchAndDecryptPasswords ruft verschlüsselte Passwörter vom Backend ab und entschlüsselt sie.
  const fetchAndDecryptPasswords = async () => {
    if (!encryptionKey) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await getPasswords();
      const encryptedPasswords = response.data;

      const decryptedPasswords = await Promise.all(encryptedPasswords.map(async pw => {
        try {
          // Entschlüsseln der Felder des Passwort-Eintrags
          const decryptedUsername = pw.encrypted_username ? await decryptData(pw.encrypted_username, pw.username_iv, pw.username_tag, encryptionKey) : '';
          const decryptedPassword = pw.encrypted_password ? await decryptData(pw.encrypted_password, pw.password_iv, pw.password_tag, encryptionKey) : '';
          const decryptedNotes = pw.encrypted_notes ? await decryptData(pw.encrypted_notes, pw.notes_iv, pw.notes_tag, encryptionKey) : '';
          
          return {
            ...pw,
            username: decryptedUsername,
            password: decryptedPassword,
            notes: decryptedNotes
          };
        } catch (decryptError) {
          // Fehlerbehandlung bei der Entschlüsselung
          console.error("Fehler beim Entschlüsseln eines Passwort-Eintrags:", decryptError);
          return { 
            ...pw, 
            website_url: pw.website_url + " [Entschlüsselungsfehler]",
            username: "[Entschlüsselungsfehler]", 
            password: "[Entschlüsselungsfehler]", 
            notes: "[Entschlüsselungsfehler]"
          };
        }
      }));

      setPasswords(decryptedPasswords); // Entschlüsselte Passwörter im Zustand speichern
    } catch (err) {
      console.error("Fehler beim Laden der Passwörter:", err);
      setError(err.response?.data?.error || "Fehler beim Laden der Passwörter."); // Fehlermeldung setzen
    } finally {
      setLoading(false); // Ladezustand beenden
    }
  };

  // useEffect Hook zum Abrufen der Passwörter beim Laden der Komponente oder Änderung des Schlüssels/Authentifizierungsstatus.
  useEffect(() => {
    if (!loadingAuth && isAuthenticated && encryptionKey) {
        fetchAndDecryptPasswords(); // Passwörter abrufen und entschlüsseln
    } else if (!loadingAuth && !isAuthenticated) {
        setPasswords([]);     // Passwörter leeren, wenn nicht authentifiziert
        setLoading(false);    // Ladezustand beenden
        setError(null);       // Fehler zurücksetzen
    } else if (!loadingAuth && isAuthenticated && !encryptionKey) {
      setPasswords([]);     // Passwörter leeren, wenn Schlüssel fehlt
      setLoading(false);    // Ladezustand beenden
      setError("Bitte melden Sie sich erneut an, um Ihre Passwörter zu sehen."); // Fehlermeldung setzen
    }
  }, [encryptionKey, isAuthenticated, loadingAuth]); // Abhängigkeiten für den Hook

  // handleSearchChange aktualisiert den Suchbegriff.
  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  // handlePasswordClick öffnet das Detail-Dialogfeld für ein ausgewähltes Passwort.
  const handlePasswordClick = (password) => {
    setCurrentPassword(password);
    setOpenDetailDialog(true);
  };

  // handleCloseDetailDialog schließt das Detail-Dialogfeld.
  const handleCloseDetailDialog = () => {
    setOpenDetailDialog(false);
    setCurrentPassword(null);
  };

  // handleAddPassword initialisiert das Formular für einen neuen Passwort-Eintrag und öffnet das Formular-Dialogfeld.
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

  // handleGeneratePassword generiert ein neues Passwort und aktualisiert das Formularfeld.
  const handleGeneratePassword = () => {
    const newPassword = generatePassword(); // Generiert ein Passwort mit Standardoptionen
    setFormData(prev => ({ ...prev, password: newPassword }));
  };

  // handleEditPassword bereitet das Formular für die Bearbeitung eines Passworts vor und öffnet das Formular-Dialogfeld.
  const handleEditPassword = (password) => {
    setFormData({
      website_url: password.website_url,
      username: password.username,
      password: password.password,
      notes: password.notes || '',
    });
    setCurrentPassword(password);
    setIsEditing(true);
    setFormError(null);
    setOpenDetailDialog(false);
    setOpenFormDialog(true);
  };

  // handleCloseFormDialog schließt das Formular-Dialogfeld und setzt die Formulardaten zurück.
  const handleCloseFormDialog = () => {
    setOpenFormDialog(false);
    setFormData({
      website_url: '',
      username: '',
      password: '',
      notes: '',
    });
    setCurrentPassword(null);
    setIsEditing(false);
    setFormError(null);
  };

  // handleFormChange aktualisiert die Formulardaten bei Eingabeänderungen.
  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setFormData(prevFormData => ({
      ...prevFormData,
      [name]: value
    }));
  };

  // handleSavePassword speichert oder aktualisiert einen Passwort-Eintrag.
  const handleSavePassword = async () => {
    setFormError(null);
    if (!encryptionKey) {
      setFormError("Encryption key not available. Cannot save password.");
      return;
    }

    if (!formData.website_url || !formData.username || !formData.password) {
      setFormError("Website URL, Benutzername und Passwort dürfen nicht leer sein.");
      return;
    }

    try {
      // Daten vor dem Senden an das Backend verschlüsseln
      const encryptedUsernameData = await encryptData(formData.username, encryptionKey);
      const encryptedPasswordData = await encryptData(formData.password, encryptionKey);
      const encryptedNotesData = formData.notes ? await encryptData(formData.notes, encryptionKey) : { encryptedText: '', iv: '', tag: '' };

      const passwordDataToSend = {
        website_url: formData.website_url,
        encrypted_username: encryptedUsernameData.encryptedText,
        username_iv: encryptedUsernameData.iv,
        username_tag: encryptedUsernameData.tag,
        encrypted_password: encryptedPasswordData.encryptedText,
        password_iv: encryptedPasswordData.iv,
        password_tag: encryptedPasswordData.tag,
        encrypted_notes: encryptedNotesData.encryptedText,
        notes_iv: encryptedNotesData.iv,
        notes_tag: encryptedNotesData.tag,
      };

      if (isEditing) {
        // Bestehendes Passwort aktualisieren
        await updatePassword(currentPassword.id, passwordDataToSend);
      } else {
        // Neues Passwort erstellen
        await createPassword(passwordDataToSend);
      }

      fetchAndDecryptPasswords(); // Passwörter nach Speicherung neu laden
      handleCloseFormDialog();    // Formular schließen
    } catch (err) {
      setFormError(err.response?.data?.error || "Fehler beim Speichern des Passworts."); // Fehlermeldung setzen
    }
  };

  // handleDeleteClick öffnet das Bestätigungsdialogfeld zum Löschen.
  const handleDeleteClick = (password) => {
    setPasswordToDelete(password);
    setOpenConfirmDialog(true);
  };

  // handleCloseConfirmDialog schließt das Bestätigungsdialogfeld zum Löschen.
  const handleCloseConfirmDialog = () => {
    setOpenConfirmDialog(false);
    setPasswordToDelete(null);
  };

  // handleDeletePassword löscht ein Passwort nach Bestätigung.
  const handleDeletePassword = async () => {
    try {
      await deletePassword(passwordToDelete.id);
      fetchAndDecryptPasswords(); // Passwörter nach Löschung neu laden
      handleCloseConfirmDialog(); // Bestätigungsdialog schließen
    } catch (err) {
      setError(err.response?.data?.error || "Fehler beim Löschen des Passworts."); // Fehlermeldung setzen
    }
  };

  // Filtert Passwörter basierend auf dem Suchbegriff.
  const filteredPasswords = passwords.filter(pw =>
    pw.website_url.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (pw.username && pw.username.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <Container maxWidth="lg" sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
      <Box sx={{ my: 4, mx: 'auto', width: '100%' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Deine Passwörter
          </Typography>
          <IconButton sx={{ ml: 1 }} onClick={toggleColorMode} color="inherit">
            {mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
          </IconButton>
        </Box>
      </Box>

      <TextField
        label="Passwörter suchen..."
        variant="outlined"
        fullWidth
        margin="normal"
        value={searchTerm}
        onChange={handleSearchChange}
        sx={{ mb: 3 }}
      />

      {loading && <Typography>Lade Passwörter...</Typography>}
      {error && <Alert severity="error">{error}</Alert>}

      {!loading && !error && passwords.length === 0 && (
        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom>
            Noch keine Passwörter gespeichert?
          </Typography>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Beginnen Sie jetzt, Ihre digitalen Anmeldeinformationen sicher zu verwalten.
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={handleAddPassword}
          >
            Erstes Passwort hinzufügen
          </Button>
          <TableContainer component={Paper} sx={{ mt: 3 }}>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: 'primary.main' }}>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Website</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Benutzername</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Passwort</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Aktionen</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredPasswords.map((password) => (
                  <TableRow
                    key={password.id}
                    sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                  >
                    <TableCell component="th" scope="row">
                      {password.website_url}
                    </TableCell>
                    <TableCell>{password.username}</TableCell>
                    <TableCell>
                      {visiblePasswords[password.id] ? password.password : '••••••••'}
                      <IconButton
                        size="small"
                        onClick={() => togglePasswordVisibility(password.id)}
                        sx={{ ml: 1 }}
                      >
                        {visiblePasswords[password.id] ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        aria-label="bearbeiten"
                        onClick={(event) => {
                          event.stopPropagation();
                          handleEditPassword(password);
                        }}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        aria-label="löschen"
                        onClick={(event) => {
                          event.stopPropagation();
                          handleDeleteClick(password);
                        }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        <Paper elevation={3} sx={{ p: 3, mt: 4 }}>
          <Typography variant="h6" component="h2" gutterBottom>
            Optionen
          </Typography>
          <Button variant="outlined" color="primary" sx={{ mr: 2 }}>
            2FA aktivieren
          </Button>
        </Paper>

        <Dialog open={openDetailDialog} onClose={handleCloseDetailDialog}>
          <DialogTitle>Passwort Details</DialogTitle>
          <DialogContent>
            {currentPassword && (
              <Box>
                <Typography variant="h6">Website:</Typography>
                <Typography>{currentPassword.website_url}</Typography>
                <Typography variant="h6" sx={{ mt: 2 }}>Benutzername:</Typography>
                <Typography>{currentPassword.username}</Typography>
                {visiblePasswords[currentPassword.id] && (
                  <>
                    <Typography variant="h6" sx={{ mt: 2 }}>Passwort:</Typography>
                    <Typography>{currentPassword.password}</Typography>
                  </>
                )}
                {currentPassword.notes && (
                  <>
                    <Typography variant="h6" sx={{ mt: 2 }}>Notizen:</Typography>
                    <Typography>{currentPassword.notes}</Typography>
                  </>
                )}
              </Box>
            )}
            {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDetailDialog}>Schließen</Button>
            {currentPassword && (
              <Button onClick={() => handleEditPassword(currentPassword)} color="primary">
                Bearbeiten
              </Button>
            )}
          </DialogActions>
        </Dialog>

        <Dialog open={openFormDialog} onClose={handleCloseFormDialog} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 2 } }}>
          <DialogTitle sx={{ borderBottom: 1, borderColor: 'divider', pb: 2 }}>{isEditing ? 'Passwort bearbeiten' : 'Neues Passwort hinzufügen'}</DialogTitle>
          <DialogContent>
            {formError && <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>}
            <TextField
              autoFocus
              margin="dense"
              name="website_url"
              label="Website URL"
              type="text"
              fullWidth
              variant="outlined"
              value={formData.website_url}
              onChange={handleFormChange}
              required
              error={!formData.website_url && formError !== null}
              helperText={!formData.website_url && formError !== null ? "Website URL ist erforderlich" : ""}
            />
            <TextField
              margin="dense"
              name="username"
              label="Benutzername"
              type="text"
              fullWidth
              variant="outlined"
              value={formData.username}
              onChange={handleFormChange}
              required
              error={!formData.username && formError !== null}
              helperText={!formData.username && formError !== null ? "Benutzername ist erforderlich" : ""}
            />
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
              <TextField
                margin="dense"
                name="password"
                label="Passwort"
                type={visiblePasswords['form'] ? 'text' : 'password'}
                fullWidth
                variant="outlined"
                value={formData.password}
                onChange={handleFormChange}
                required
                error={!formData.password && formError !== null}
                helperText={!formData.password && formError !== null ? "Passwort ist erforderlich" : ""}
                InputProps={{
                  endAdornment: (
                    <IconButton
                      onClick={() => togglePasswordVisibility('form')}
                      edge="end"
                    >
                      {visiblePasswords['form'] ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  ),
                }}
              />
              <Button
                variant="contained"
                onClick={generatePassword}
                sx={{ mt: 2 }}
              >
                Generieren
              </Button>
            </Box>
            <TextField
              margin="dense"
              name="notes"
              label="Notizen (optional)"
              type="text"
              fullWidth
              variant="outlined"
              multiline
              rows={2}
              value={formData.notes}
              onChange={handleFormChange}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseFormDialog}>Abbrechen</Button>
            <Button onClick={handleSavePassword} color="primary">
              {isEditing ? 'Speichern' : 'Hinzufügen'}
            </Button>
          </DialogActions>
        </Dialog>

      {/* Bestätigungsdialogfeld zum Löschen */}
      <Dialog open={openConfirmDialog} onClose={handleCloseConfirmDialog}>
        <DialogTitle>Passwort löschen</DialogTitle>
        <DialogContent>
          <Typography>Sind Sie sicher, dass Sie dieses Passwort löschen möchten?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseConfirmDialog}>Abbrechen</Button>
          <Button onClick={handleDeletePassword} color="error" variant="contained">Löschen</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default DashboardPage;