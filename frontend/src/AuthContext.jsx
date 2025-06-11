import React, { createContext, useState, useContext, useEffect } from 'react';
import { deriveKeyFromPassword } from './utils/crypto'; // Importiere die Schlüsselableitungsfunktion
import { setAuthToken } from './services/api'; // Korrigierter Importpfad
import { useThemeContext } from './ThemeContext';
import api from './services/api'; // Implied import for the new loadAuthStatus function

const AuthContext = createContext({
  user: null,
  encryptionKey: null, // Store the derived encryption key here
  login: async (username, masterPassword, saltBase64, token) => {}, // Method to handle login and key derivation
  logout: () => {}, // Method to handle logout
  isAuthenticated: false,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [encryptionKey, setEncryptionKey] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  // Funktion zum Laden des Authentifizierungsstatus aus dem Local Storage
  const loadAuthStatus = async () => {
    console.log('AuthContext: Attempting to load auth status from localStorage.'); // Debugging
    const storedToken = localStorage.getItem('access_token');
    console.log('AuthContext: Retrieved storedToken:', storedToken); // Debugging

    if (storedToken) {
      setAuthToken(storedToken); // Setze den Token in api.js
      console.log('AuthContext: setAuthToken called with storedToken.'); // Debugging
      // In einer Produktions-App MUSS der Token gegen das Backend validiert und Benutzerdetails geladen werden!
      setUser({}); // Setze einen Platzhalter-Benutzer, um isAuthenticated auf true zu setzen
      console.log('AuthContext: Auth token found and set via setAuthToken.');
    } else {
      setAuthToken(null); // Stelle sicher, dass der Token in api.js null ist
      setUser(null); // Kein Token im localStorage
      console.log('AuthContext: No auth token found in localStorage.');
    }
    // Der encryptionKey kann hier NICHT wiederhergestellt werden, da er nicht gespeichert wird
    // Der Benutzer muss das Master-Passwort erneut eingeben, um den Schlüssel nach dem Neuladen wiederherzustellen.

    setLoadingAuth(false); // Beendet den Ladezustand, unabhängig vom Erfolg
  };

	// useEffect Hook wird beim Mounten der Komponente ausgeführt, um den Authentifizierungsstatus zu laden.
	useEffect(() => {
		loadAuthStatus();
	}, []); // Leeres Array stellt sicher, dass dies nur einmal beim Mounten ausgeführt wird

  // login-Funktion behandelt den Anmeldevorgang, leitet den Verschlüsselungsschlüssel ab und speichert den Token.
  const login = async (username, password, salt, token) => {
    try {
      // Leite den Verschlüsselungsschlüssel auf Client-Seite ab
      const derivedKey = await deriveKeyFromPassword(password, salt);
      setEncryptionKey(derivedKey); // Speichert den abgeleiteten Schlüssel im Zustand

      // Speichere den JWT Token über die api.js Funktion und im Local Storage
      setAuthToken(token); 

      setUser({ username }); // Setze den Benutzerstatus

      console.log('AuthContext: User and token state updated after login.'); // Debugging

    } catch (error) {
      // Fehlerbehandlung: Schlüssel und Benutzerinformationen zurücksetzen
      setEncryptionKey(null);
      setUser(null);
      setIs2FAVerified(false); // Setze auf false beim Logout
      setAuthToken(null); // Stelle sicher, dass der Token bei Fehlern entfernt wird
      throw error; // Fehler weiterleiten
    }
  };

  const logout = () => {
    console.log('AuthContext: Starting logout process.'); // Debugging
    // Clear authentication state and encryption key
    setUser(null);
    setEncryptionKey(null);
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
    <AuthContext.Provider value={{ user, encryptionKey, login, logout, isAuthenticated, loadingAuth }}> {/* loadingAuth zum Value hinzufügen */}
      {children}
    </AuthContext.Provider>
  );
}; 