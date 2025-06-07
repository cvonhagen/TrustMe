import React, { createContext, useState, useContext, useEffect } from 'react';
import { deriveKeyFromPassword } from './utils/crypto'; // Importiere die Schlüsselableitungsfunktion
import { setAuthToken } from './services/api'; // Korrigierter Importpfad
import { useThemeContext } from './ThemeContext';

// Erstelle den AuthContext
export const AuthContext = createContext({
	user: null, // Speichere den Benutzer hier
	encryptionKey: null, // Speichere den abgeleiteten Verschlüsselungsschlüssel hier
	login: async (username, masterPassword, saltBase64, token) => {}, // Methode zum Login und Schlüsselableitung
	logout: () => {}, // Methode zum Logout
	isAuthenticated: false, // Authentifizierungsstatus
});

export const AuthProvider = ({ children }) => {
	const [user, setUser] = useState(null);
	const [isAuthenticated, setIsAuthenticated] = useState(false);
	const [loadingAuth, setLoadingAuth] = useState(true);
	const [encryptionKey, setEncryptionKey] = useState(null);

	// Funktion zum Laden des Authentifizierungsstatus aus dem Local Storage
	const loadAuthStatus = async () => {
		const storedToken = localStorage.getItem('access_token');
		if (storedToken) {
			setAuthToken(storedToken); // Setze den Token in api.js
			// In einer Produktions-App MUSS der Token gegen das Backend validiert und Benutzerdetails geladen werden!
			setUser({}); // Setze einen Platzhalter-Benutzer, um isAuthenticated auf true zu setzen
			setIsAuthenticated(true);
		} else {
			setAuthToken(null); // Stelle sicher, dass der Token in api.js null ist
			setUser(null); // Kein Token im localStorage
			setIsAuthenticated(false);
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

      console.log('AuthContext: User and token state updated after login.'); // Debugging

    } catch (error) {
      console.error('AuthContext: Failed to derive encryption key or store token during login:', error);
      // Handle error
      setEncryptionKey(null);
      setUser(null);
      setAuthToken(null); // Stelle sicher, dass der Token bei Fehlern entfernt wird
      throw error;
    }
  };

	const logout = () => {
		// Lösche Authentifizierungsstatus und Verschlüsselungsschlüssel
		setUser(null);
		setEncryptionKey(null);
		setIsAuthenticated(false);
		setAuthToken(null); // Setze Token auf null über die api.js Funktion
	};

	// Zeige einen Ladezustand, während der Authentifizierungsstatus geprüft wird
	if (loadingAuth) {
		return <div>Lade Authentifizierung...</div>; // Oder eine bessere Ladeanzeige
	}

	return (
		<AuthContext.Provider value={{ user, encryptionKey, login, logout, isAuthenticated, loadingAuth }}>
			{children}
		</AuthContext.Provider>
	);
};

// Custom hook to use the AuthContext
export const useAuth = () => {
  return useContext(AuthContext);
}; 