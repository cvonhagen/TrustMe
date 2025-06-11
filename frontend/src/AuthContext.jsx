import React, { createContext, useState, useContext, useEffect } from 'react';
import { deriveKeyFromPassword } from './utils/crypto'; // Import the key derivation function
import { setAuthToken } from './services/api'; // Korrigierter Importpfad
import { useThemeContext } from './ThemeContext';
import api from './services/api'; // Implied import for the new loadAuthStatus function

const AuthContext = createContext({
  user: null,
  encryptionKey: null, // Store the derived encryption key here
  login: async (username, masterPassword, saltBase64, token) => {}, // Method to handle login and key derivation
  logout: () => {}, // Method to handle logout
  isAuthenticated: false,
  is2FAVerified: false, // Add is2FAVerified to context
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [encryptionKey, setEncryptionKey] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [is2FAVerified, setIs2FAVerified] = useState(false); // Add is2FAVerified state

  // Funktion zum Laden des Authentifizierungsstatus aus dem Local Storage
  const loadAuthStatus = async () => {
    console.log('AuthContext: Attempting to load auth status from localStorage.'); // Debugging
    const storedToken = localStorage.getItem('access_token');
    console.log('AuthContext: Retrieved storedToken:', storedToken); // Debugging

    if (storedToken) {
      setAuthToken(storedToken); // Setze den Token in api.js
      console.log('AuthContext: setAuthToken called with storedToken.'); // Debugging
      try {
        // Führen Sie einen API-Aufruf aus, um den Token zu validieren und Benutzerdetails zu laden
        const response = await api.get('/auth/me'); // Beispiel-Endpunkt, anpassen falls nötig
        setUser(response.data); // Setzen Sie die tatsächlichen Benutzerdaten
        setIs2FAVerified(true); // Setze auf true, wenn der Token erfolgreich validiert wurde
        console.log('AuthContext: User data loaded and token validated successfully.');
      } catch (error) {
        console.error('AuthContext: Token validation failed or user data could not be loaded:', error);
        // Token ist ungültig oder abgelaufen, den Benutzer abmelden
        setAuthToken(null); // Sicherstellen, dass der Token gelöscht wird
        setUser(null); // Sicherstellen, dass der Benutzerstatus zurückgesetzt wird
        localStorage.removeItem('access_token'); // Auch aus dem localStorage entfernen
      }
    } else {
      setAuthToken(null); // Stelle sicher, dass der Token in api.js null ist
      setUser(null); // Kein Token im localStorage
      console.log('AuthContext: No auth token found in localStorage.');
    }
    // Der encryptionKey kann hier NICHT wiederhergestellt werden, da er nicht gespeichert wird
    // Der Benutzer muss das Master-Passwort erneut eingeben, um den Schlüssel nach dem Neuladen wiederherzustellen.

    setLoadingAuth(false); // Ladezustand beenden, unabhängig vom Erfolg
    console.log('AuthContext: loadingAuth set to false.'); // Debugging
  };

  // Lade Authentifizierungsstatus beim Mounten der Komponente
  useEffect(() => {
    loadAuthStatus();
  }, []); // Leeres Array stellt sicher, dass dies nur einmal beim Mounten ausgeführt wird

  // Modified login function to handle key derivation and token storage
  const login = async (username, password, salt, token) => {
    try {
      console.log('AuthContext: Starting login process.'); // Debugging
      // Derive the encryption key client-side
      const derivedKey = await deriveKeyFromPassword(password, salt);
      setEncryptionKey(derivedKey); // Store the derived key in state
      console.log('AuthContext: Encryption key derived.'); // Debugging

      // Speichere den JWT Token über die api.js Funktion
      setAuthToken(token); // Setze den Token in api.js und localStorage
      console.log('AuthContext: setAuthToken called with token:', token); // Debugging

      setUser({ username }); // Setze den Benutzerstatus
      setIs2FAVerified(true); // Setze auf true nach erfolgreichem Login

      console.log('AuthContext: User and token state updated after login.'); // Debugging

    } catch (error) {
      console.error('AuthContext: Failed to derive encryption key or store token during login:', error);
      // Handle error
      setEncryptionKey(null);
      setUser(null);
      setIs2FAVerified(false); // Setze auf false beim Logout
      setAuthToken(null); // Stelle sicher, dass der Token bei Fehlern entfernt wird
      throw error;
    }
  };

  const logout = () => {
    console.log('AuthContext: Starting logout process.'); // Debugging
    // Clear authentication state and encryption key
    setUser(null);
    setEncryptionKey(null);
    setIs2FAVerified(false); // Setze auf false beim Logout
    setAuthToken(null); // Setze Token auf null über die api.js Funktion
    console.log('AuthContext: User logged out, encryption key and token cleared.'); // Debugging
  };

  const isAuthenticated = user !== null; // isAuthenticated hängt jetzt wieder nur vom user ab

  // Zeige einen Ladezustand, während der Authentifizierungsstatus geprüft wird
  if (loadingAuth) {
    console.log('AuthContext: Rendering loading state...'); // Debugging
    return <div>Lade Authentifizierung...</div>; // Oder eine bessere Ladeanzeige
  }

  console.log('AuthContext: Rendering AuthContext.Provider. isAuthenticated:', isAuthenticated); // Debugging
  return (
    <AuthContext.Provider value={{ user, encryptionKey, login, logout, isAuthenticated, loadingAuth, is2FAVerified }}> {/* loadingAuth und is2FAVerified zum Value hinzufügen */}
      {children}
    </AuthContext.Provider>
  );
}; 