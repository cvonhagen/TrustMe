// src/pages/Dashboard.jsx
import React, { useState, useEffect } from "react";
import {
  Container,
  Typography,
  Paper,
  Box,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Alert,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Snackbar,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import Brightness4Icon from "@mui/icons-material/Brightness4";
import Brightness7Icon from "@mui/icons-material/Brightness7";
import ExitToAppIcon from "@mui/icons-material/ExitToApp";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import {
  getPasswords,
  createPassword,
  updatePassword,
  deletePassword,
  setup2FA,
  verify2FA,
  disable2FA,
  deleteAccount,
} from "../services/api";
import { decryptData, encryptData } from "../utils/crypto";
import { useAuth } from "../AuthContext";
import { useThemeContext } from "../ThemeContext";
import { useNavigate } from "react-router-dom";
import Footer from "../components/Footer";


const DashboardPage = () => {
  const [passwords, setPasswords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [openDetailDialog, setOpenDetailDialog] = useState(false);
  const [currentPassword, setCurrentPassword] = useState(null);
  const [openFormDialog, setOpenFormDialog] = useState(false);
  const [formData, setFormData] = useState({
    website_url: "",
    username: "",
    password: "",
    notes: "",
  });
  const [isEditing, setIsEditing] = useState(false);
  const [formError, setFormError] = useState(null);
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
  const [passwordToDelete, setPasswordToDelete] = useState(null);
  const [open2FADialog, setOpen2FADialog] = useState(false);
  const [openDeleteAccountDialog, setOpenDeleteAccountDialog] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [twoFACode, setTwoFACode] = useState("");
  const [twoFAError, setTwoFAError] = useState(null);
  const [deleteAccountError, setDeleteAccountError] = useState(null);
  const [twoFAEnabled, setTwoFAEnabled] = useState(false);
  const [visiblePasswords, setVisiblePasswords] = useState({});
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  // Hooks hinzufügen
  const { encryptionKey, isAuthenticated, loadingAuth, logout } = useAuth();
  const { toggleColorMode, mode } = useThemeContext();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const togglePasswordVisibility = (passwordId) => {
    setVisiblePasswords((prev) => ({
      ...prev,
      [passwordId]: !prev[passwordId],
    }));
  };

  const generatePassword = () => {
    const length = 16;
    const charset =
      "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?";
    let password = "";
    for (let i = 0; i < length; i++) {
      password += charset[Math.floor(Math.random() * charset.length)];
    }
    setFormData((prev) => ({ ...prev, password }));
    return password;
  };

  const copyToClipboard = async (text, type) => {
    try {
      await navigator.clipboard.writeText(text);
      setSnackbarMessage(`${type} wurde in die Zwischenablage kopiert`);
      setSnackbarOpen(true);
    } catch (err) {
      console.error("Fehler beim Kopieren:", err);
      setSnackbarMessage("Fehler beim Kopieren in die Zwischenablage");
      setSnackbarOpen(true);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  const fetchAndDecryptPasswords = async () => {
    if (!encryptionKey) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await getPasswords();
      const encryptedPasswords = response.data || [];
      const decryptedPasswords = await Promise.all(
        encryptedPasswords.map(async (pw) => {
          try {
            const decryptedUsername = pw.encrypted_username
              ? await decryptData(
                  pw.encrypted_username,
                  pw.username_iv,
                  pw.username_tag,
                  encryptionKey
                )
              : "";
            const decryptedPassword = pw.encrypted_password
              ? await decryptData(
                  pw.encrypted_password,
                  pw.password_iv,
                  pw.password_tag,
                  encryptionKey
                )
              : "";
            const decryptedNotes = pw.encrypted_notes
              ? await decryptData(
                  pw.encrypted_notes,
                  pw.notes_iv,
                  pw.notes_tag,
                  encryptionKey
                )
              : "";
            return {
              ...pw,
              username: decryptedUsername,
              password: decryptedPassword,
              notes: decryptedNotes,
            };
          } catch (decryptError) {
            console.error(
              "Fehler beim Entschlüsseln eines Passwort-Eintrags:",
              decryptError
            );
            return {
              ...pw,
              website_url: (pw.website_url || "") + " [Entschlüsselungsfehler]",
              username: "[Entschlüsselungsfehler]",
              password: "[Entschlüsselungsfehler]",
              notes: "[Entschlüsselungsfehler]",
            };
          }
        })
      );
      setPasswords(decryptedPasswords);
    } catch (err) {
      console.error("Fehler beim Laden der Passwörter:", err);
      setError(
        err.response?.data?.error || "Fehler beim Laden der Passwörter."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!loadingAuth && isAuthenticated && encryptionKey) {
      fetchAndDecryptPasswords();
    } else if (!loadingAuth && !isAuthenticated) {
      setPasswords([]);
      setLoading(false);
      setError(null);
    } else if (!loadingAuth && isAuthenticated && !encryptionKey) {
      setPasswords([]);
      setLoading(false);
      setError("Bitte melden Sie sich erneut an, um Ihre Passwörter zu sehen.");
    }
  }, [encryptionKey, isAuthenticated, loadingAuth]);

  const handleSearchChange = (event) => setSearchTerm(event.target.value);

  const handlePasswordClick = (password) => {
    setCurrentPassword(password);
    setOpenDetailDialog(true);
  };

  const handleCloseDetailDialog = () => {
    setOpenDetailDialog(false);
    setCurrentPassword(null);
  };

  const handleAddPassword = () => {
    setFormData({ website_url: "", username: "", password: "", notes: "" });
    setIsEditing(false);
    setFormError(null);
    setOpenFormDialog(true);
  };

  const handleEditPassword = (password) => {
    setFormData({
      website_url: password.website_url,
      username: password.username,
      password: password.password,
      notes: password.notes || "",
    });
    setCurrentPassword(password);
    setIsEditing(true);
    setFormError(null);
    setOpenDetailDialog(false);
    setOpenFormDialog(true);
  };

  const handleCloseFormDialog = () => {
    setOpenFormDialog(false);
    setFormData({ website_url: "", username: "", password: "", notes: "" });
    setCurrentPassword(null);
    setIsEditing(false);
    setFormError(null);
  };

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSavePassword = async () => {
    setFormError(null);
    if (!encryptionKey) {
      setFormError("Encryption key not available. Cannot save password.");
      return;
    }
    if (!formData.website_url || !formData.username || !formData.password) {
      setFormError(
        "Website URL, Benutzername und Passwort dürfen nicht leer sein."
      );
      return;
    }
    try {
      const encryptedUsernameData = await encryptData(
        formData.username,
        encryptionKey
      );
      const encryptedPasswordData = await encryptData(
        formData.password,
        encryptionKey
      );
      const encryptedNotesData = formData.notes
        ? await encryptData(formData.notes, encryptionKey)
        : { encryptedText: "", iv: "", tag: "" };

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
        await updatePassword(currentPassword.id, passwordDataToSend);
      } else {
        await createPassword(passwordDataToSend);
      }

      await fetchAndDecryptPasswords();
      handleCloseFormDialog();
    } catch (err) {
      setFormError(
        err.response?.data?.error || "Fehler beim Speichern des Passworts."
      );
    }
  };

  const handleDeleteClick = (password) => {
    setPasswordToDelete(password);
    setOpenConfirmDialog(true);
  };

  const handleCloseConfirmDialog = () => {
    setOpenConfirmDialog(false);
    setPasswordToDelete(null);
  };

  const handleDeletePassword = async () => {
    try {
      await deletePassword(passwordToDelete.id);
      await fetchAndDecryptPasswords();
      handleCloseConfirmDialog();
    } catch (err) {
      setError(
        err.response?.data?.error || "Fehler beim Löschen des Passworts."
      );
    }
  };

  // 2FA Setup Handler
  const handle2FASetup = async () => {
    try {
      setTwoFAError(null);
      const response = await setup2FA();
      console.log("2FA Setup Response:", response.data); // Debug-Ausgabe
      setQrCodeUrl(response.data.qr_code_url);
      setOpen2FADialog(true);
    } catch (err) {
      console.error("2FA Setup Error:", err); // Debug-Ausgabe
      setTwoFAError(
        err.response?.data?.error || "Fehler beim Einrichten der 2FA."
      );
    }
  };

  // 2FA Verification Handler
  const handleVerify2FA = async () => {
    try {
      setTwoFAError(null);
      await verify2FA({ code: twoFACode });
      setOpen2FADialog(false);
      setTwoFACode("");
      setTwoFAEnabled(true);
      alert("2FA erfolgreich aktiviert!");
    } catch (err) {
      setTwoFAError(err.response?.data?.error || "Ungültiger 2FA-Code.");
    }
  };

  // 2FA Disable Handler
  const handleDisable2FA = async () => {
    try {
      setTwoFAError(null);
      await disable2FA();
      setTwoFAEnabled(false);
      alert("2FA erfolgreich deaktiviert!");
    } catch (err) {
      setTwoFAError(err.response?.data?.error || "Fehler beim Deaktivieren der 2FA.");
    }
  };

  // Close 2FA Dialog
  const handleClose2FADialog = () => {
    setOpen2FADialog(false);
    setTwoFACode("");
    setTwoFAError(null);
    setQrCodeUrl("");
  };

  // Account Delete Handler
  const handleDeleteAccount = () => {
    setDeleteAccountError(null);
    setOpenDeleteAccountDialog(true);
  };

  // Confirm Account Delete
  const handleConfirmDeleteAccount = async () => {
    try {
      setDeleteAccountError(null);
      await deleteAccount();
      alert("Account erfolgreich gelöscht!");
      logout();
      navigate("/login");
    } catch (err) {
      setDeleteAccountError(
        err.response?.data?.error || "Fehler beim Löschen des Accounts."
      );
    }
  };

  // Close Delete Account Dialog
  const handleCloseDeleteAccountDialog = () => {
    setOpenDeleteAccountDialog(false);
    setDeleteAccountError(null);
  };

  const filteredPasswords = passwords.filter(
    (pw) =>
      (pw.website_url || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (pw.username &&
        pw.username.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <>
      <Container
        maxWidth="lg"
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "flex-start",
          minHeight: "calc(100vh - 80px)", // Platz für festen Footer
          paddingBottom: "100px", // Extra Platz für Footer
          paddingTop: "20px",
        }}
      >
        <Box
          sx={{
            my: 4,
            mx: "auto",
            width: "100%",
            border: "2px solid",
            borderColor: "primary.main",
            borderRadius: 2,
            padding: 3,
            backgroundColor: "background.paper",
            boxShadow: 3,
          }}
        >
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 3,
            }}
          >
            <Typography variant="h4" component="h1" gutterBottom>
              Deine Passwörter
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <IconButton
                sx={{ ml: 1 }}
                onClick={toggleColorMode}
                color="inherit"
              >
                {mode === "dark" ? <Brightness7Icon /> : <Brightness4Icon />}
              </IconButton>
              <Button
                variant="contained"
                color="secondary"
                startIcon={<ExitToAppIcon />}
                onClick={handleLogout}
                sx={{ ml: 2 }}
              >
                Logout
              </Button>
            </Box>
          </Box>



          <TextField
            label="Passwörter suchen..."
            variant="outlined"
            fullWidth
            margin="normal"
            value={searchTerm}
            onChange={handleSearchChange}
            sx={{ mt: 3 }}
          />

          {!loading && !error && passwords.length > 0 && (
            <Box sx={{ mt: 3, display: "flex", justifyContent: "center" }}>
              <Button
                variant="contained"
                color="primary"
                onClick={handleAddPassword}
              >
                Neues Passwort hinzufügen
              </Button>
            </Box>
          )}

          {loading && <Typography>Lade Passwörter...</Typography>}
          {error && <Alert severity="error">{error}</Alert>}

          {!loading && !error && passwords.length === 0 && (
            <Box sx={{ mt: 3, textAlign: "center" }}>
              <Typography variant="h6" gutterBottom>
                Noch keine Passwörter gespeichert?
              </Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                Beginne hier, um deine ersten Passwörter zu speichern!
              </Typography>
              <Button
                variant="contained"
                color="primary"
                onClick={handleAddPassword}
              >
                Neues Passwort hinzufügen
              </Button>
            </Box>
          )}

          {!loading && !error && passwords.length > 0 && (
            <>
              <TableContainer component={Paper} sx={{ mt: 3 }}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: "primary.main" }}>
                      <TableCell sx={{ color: "white", fontWeight: "bold" }}>
                        Website
                      </TableCell>
                      <TableCell sx={{ color: "white", fontWeight: "bold" }}>
                        Benutzername
                      </TableCell>
                      <TableCell sx={{ color: "white", fontWeight: "bold" }}>
                        Passwort
                      </TableCell>
                      <TableCell sx={{ color: "white", fontWeight: "bold" }}>
                        Aktionen
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredPasswords.map((password) => (
                      <TableRow
                        key={password.id}
                        sx={{
                          "&:last-child td, &:last-child th": { border: 0 },
                        }}
                      >
                        <TableCell component="th" scope="row">
                          {password.website_url}
                          <IconButton
                            size="small"
                            onClick={() =>
                              copyToClipboard(
                                password.website_url,
                                "Website URL"
                              )
                            }
                            sx={{ ml: 1 }}
                          >
                            <ContentCopyIcon />
                          </IconButton>
                        </TableCell>
                        <TableCell>
                          {password.username}
                          <IconButton
                            size="small"
                            onClick={() =>
                              copyToClipboard(password.username, "Benutzername")
                            }
                            sx={{ ml: 1 }}
                          >
                            <ContentCopyIcon />
                          </IconButton>
                        </TableCell>
                        <TableCell>
                          {visiblePasswords[password.id]
                            ? password.password
                            : "••••••••"}
                          <IconButton
                            size="small"
                            onClick={() =>
                              togglePasswordVisibility(password.id)
                            }
                            sx={{ ml: 1 }}
                          >
                            {visiblePasswords[password.id] ? (
                              <VisibilityOffIcon />
                            ) : (
                              <VisibilityIcon />
                            )}
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() =>
                              copyToClipboard(password.password, "Passwort")
                            }
                            sx={{ ml: 1 }}
                          >
                            <ContentCopyIcon />
                          </IconButton>
                        </TableCell>
                        <TableCell align="right">
                          <IconButton
                            aria-label="bearbeiten"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditPassword(password);
                            }}
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton
                            aria-label="löschen"
                            onClick={(e) => {
                              e.stopPropagation();
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
            </>
          )}

          {/* Optionen - immer anzeigen */}
          {!loading && !error && (
            <Paper elevation={3} sx={{ p: 3, mt: 4 }}>
              <Typography variant="h6" component="h2" gutterBottom>
                Optionen
              </Typography>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: 2,
                }}
              >
                <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                  {!twoFAEnabled ? (
                    <Button
                      variant="outlined"
                      color="primary"
                      onClick={handle2FASetup}
                    >
                      2FA aktivieren
                    </Button>
                  ) : (
                    <Button
                      variant="outlined"
                      color="warning"
                      onClick={handleDisable2FA}
                    >
                      2FA deaktivieren
                    </Button>
                  )}
                </Box>
                <Button
                  variant="outlined"
                  color="error"
                  onClick={handleDeleteAccount}
                >
                  Account löschen
                </Button>
              </Box>
            </Paper>
          )}
        </Box>

        {/* Details Dialog */}
        <Dialog open={openDetailDialog} onClose={handleCloseDetailDialog}>
          <DialogTitle>Passwort Details</DialogTitle>
          <DialogContent>
            {currentPassword && (
              <Box>
                <Typography variant="h6">Website:</Typography>
                <Typography>{currentPassword.website_url}</Typography>
                <Typography variant="h6" sx={{ mt: 2 }}>
                  Benutzername:
                </Typography>
                <Typography>{currentPassword.username}</Typography>
                {visiblePasswords[currentPassword.id] && (
                  <>
                    <Typography variant="h6" sx={{ mt: 2 }}>
                      Passwort:
                    </Typography>
                    <Typography>{currentPassword.password}</Typography>
                  </>
                )}
                {currentPassword.notes && (
                  <>
                    <Typography variant="h6" sx={{ mt: 2 }}>
                      Notizen:
                    </Typography>
                    <Typography>{currentPassword.notes}</Typography>
                  </>
                )}
              </Box>
            )}
            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDetailDialog}>Schließen</Button>
            {currentPassword && (
              <Button
                onClick={() => handleEditPassword(currentPassword)}
                color="primary"
              >
                Bearbeiten
              </Button>
            )}
          </DialogActions>
        </Dialog>

        {/* Form Dialog */}
        <Dialog
          open={openFormDialog}
          onClose={handleCloseFormDialog}
          maxWidth="sm"
          fullWidth
          slotProps={{ paper: { sx: { borderRadius: 2 } } }}
        >
          <DialogTitle sx={{ borderBottom: 1, borderColor: "divider", pb: 2 }}>
            {isEditing ? "Passwort bearbeiten" : "Neues Passwort hinzufügen"}
          </DialogTitle>
          <DialogContent>
            {formError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {formError}
              </Alert>
            )}
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
              helperText={
                !formData.website_url && formError !== null
                  ? "Website URL ist erforderlich"
                  : ""
              }
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
              helperText={
                !formData.username && formError !== null
                  ? "Benutzername ist erforderlich"
                  : ""
              }
            />
            <Box sx={{ display: "flex", gap: 1, alignItems: "flex-start" }}>
              <TextField
                margin="dense"
                name="password"
                label="Passwort"
                type={visiblePasswords["form"] ? "text" : "password"}
                fullWidth
                variant="outlined"
                value={formData.password}
                onChange={handleFormChange}
                required
                error={!formData.password && formError !== null}
                helperText={
                  !formData.password && formError !== null
                    ? "Passwort ist erforderlich"
                    : ""
                }
                slotProps={{
                  input: {
                    endAdornment: (
                      <IconButton
                        onClick={() => togglePasswordVisibility("form")}
                        edge="end"
                      >
                        {visiblePasswords["form"] ? (
                          <VisibilityOffIcon />
                        ) : (
                          <VisibilityIcon />
                        )}
                      </IconButton>
                    ),
                  },
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
              Speichern
            </Button>
          </DialogActions>
        </Dialog>

        {/* Confirm Delete Dialog */}
        <Dialog open={openConfirmDialog} onClose={handleCloseConfirmDialog}>
          <DialogTitle>Passwort löschen</DialogTitle>
          <DialogContent>
            <Typography>
              Sind Sie sicher, dass Sie dieses Passwort löschen möchten? Diese
              Aktion kann nicht rückgängig gemacht werden.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseConfirmDialog}>Abbrechen</Button>
            <Button onClick={handleDeletePassword} color="error">
              Löschen
            </Button>
          </DialogActions>
        </Dialog>

        {/* 2FA Setup Dialog */}
        <Dialog open={open2FADialog} onClose={handleClose2FADialog}>
          <DialogTitle>2FA Einrichten</DialogTitle>
          <DialogContent>
            {qrCodeUrl ? (
              <Box sx={{ textAlign: "center", mb: 2 }}>
                <Typography variant="body1" gutterBottom>
                  Scannen Sie den QR-Code mit Ihrer Authenticator-App:
                </Typography>
                <img
                  src={qrCodeUrl}
                  alt="2FA QR Code"
                  style={{ maxWidth: "200px", height: "auto" }}
                  onError={(e) => {
                    console.error("QR Code Ladefehler:", e);
                    e.target.style.display = "none";
                  }}
                />
              </Box>
            ) : (
              <Box sx={{ textAlign: "center", mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  QR-Code wird geladen...
                </Typography>
              </Box>
            )}
            <TextField
              autoFocus
              margin="dense"
              label="Bestätigungscode"
              type="text"
              fullWidth
              variant="outlined"
              value={twoFACode}
              onChange={(e) => setTwoFACode(e.target.value)}
              placeholder="6-stelliger Code aus Ihrer App"
            />
            {twoFAError && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {twoFAError}
              </Alert>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose2FADialog}>Abbrechen</Button>
            <Button
              onClick={handleVerify2FA}
              variant="contained"
              disabled={!twoFACode}
            >
              Bestätigen
            </Button>
          </DialogActions>
        </Dialog>

        {/* Delete Account Confirmation Dialog */}
        <Dialog
          open={openDeleteAccountDialog}
          onClose={handleCloseDeleteAccountDialog}
        >
          <DialogTitle>Account löschen</DialogTitle>
          <DialogContent>
            <Typography variant="body1" gutterBottom>
              Sind Sie sicher, dass Sie Ihren Account permanent löschen möchten?
            </Typography>
            <Typography variant="body2" color="error" gutterBottom>
              Diese Aktion kann nicht rückgängig gemacht werden. Alle Ihre
              gespeicherten Passwörter werden gelöscht.
            </Typography>
            {deleteAccountError && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {deleteAccountError}
              </Alert>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDeleteAccountDialog}>Abbrechen</Button>
            <Button
              onClick={handleConfirmDeleteAccount}
              variant="contained"
              color="error"
            >
              Account löschen
            </Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar für Kopier-Feedback */}
        <Snackbar
          open={snackbarOpen}
          autoHideDuration={3000}
          onClose={handleCloseSnackbar}
          message={snackbarMessage}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        />
      </Container>
      <Footer />
    </>
  );
};

export default DashboardPage;
