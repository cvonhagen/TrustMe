import React, { createContext, useState, useContext, useEffect } from 'react';
import { deriveKeyFromPassword } from './utils/crypto';
import { setAuthToken, validateToken } from './services/api';

// AuthContext für globale Authentifizierung und Verschlüsselungsschlüssel-Verwaltung
const AuthContext = createContext({
  user: null,
  encryptionKey: null, // Client-seitiger Verschlüsselungsschlüssel
  login: async (username, masterPassword, saltBase64, token) => {},
  logout: () => {},
  isAuthenticated: false,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [encryptionKey, setEncryptionKey] = useState(null); // Für lokale Verschlüsselung
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [is2FAVerified, setIs2FAVerified] = useState(false);

  // Lädt Auth-Status beim App-Start und validiert Token gegen Backend
  const loadAuthStatus = async () => {
    console.log('AuthContext: Attempting to load auth status from localStorage.');
    const storedToken = localStorage.getItem('access_token');
    console.log('AuthContext: Retrieved storedToken:', storedToken);

    if (storedToken) {
      setAuthToken(storedToken);
      console.log('AuthContext: setAuthToken called with storedToken.');
      
      try {
        // Token-Validierung gegen Backend - wichtig für Serverneustart-Erkennung
        await validateToken();
        console.log('AuthContext: Token validation successful.');
        setUser({});
        setIs2FAVerified(true);
        console.log('AuthContext: Auth token found and validated.');
      } catch (error) {
        console.log('AuthContext: Token validation failed or server unreachable. Clearing auth state.', error);
        // Bei Serverausfall oder ungültigem Token: Auth-State zurücksetzen
        setAuthToken(null);
        setUser(null);
        setIs2FAVerified(false);
        setEncryptionKey(null);
      }
    } else {
      setAuthToken(null);
      setUser(null);
      console.log('AuthContext: No auth token found in localStorage.');
    }
    // Der encryptionKey kann hier NICHT wiederhergestellt werden, da er nicht gespeichert wird
    // Der Benutzer muss das Master-Passwort erneut eingeben, um den Schlüssel nach dem Neuladen wiederherzustellen.

    setLoadingAuth(false); // Beendet den Ladezustand, unabhängig vom Erfolg
    console.log('AuthContext: loadAuthStatus completed. isAuthenticated:', user !== null, 'is2FAVerified:', is2FAVerified); // Debugging
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
      setIs2FAVerified(true); // Set 2FA to true upon successful login

      console.log('AuthContext: User and token state updated after login. isAuthenticated:', true, 'is2FAVerified:', true); // Debugging

    } catch (error) {
      // Fehlerbehandlung: Schlüssel und Benutzerinformationen zurücksetzen
      setEncryptionKey(null);
    setUser(null);
    setIs2FAVerified(false); // Set to false on error
    setAuthToken(null); // Ensure token is removed on error
    throw error; // Propagate error
    }
  };

  const logout = () => {
    console.log('AuthContext: Starting logout process.'); // Debugging
    // Clear authentication state and encryption key
    setUser(null);
    setEncryptionKey(null);
    setIs2FAVerified(false); // Set to false on logout
    setAuthToken(null); // Set token to null via api.js function
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
    <AuthContext.Provider value={{ user, encryptionKey, login, logout, isAuthenticated, loadingAuth, is2FAVerified }}>
      {children}
    </AuthContext.Provider>
  );
};