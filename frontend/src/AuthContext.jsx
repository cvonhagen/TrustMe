import React, { createContext, useState, useContext, useEffect } from 'react';
import { deriveKeyFromPassword } from './utils/crypto'; // Importiere die Schlüsselableitungsfunktion
import { setAuthToken } from './services/api'; // Korrigierter Importpfad
import { useThemeContext } from './ThemeContext';

// Erstelle den AuthContext, der Benutzer- und Verschlüsselungsschlüsselinformationen sowie Authentifizierungsfunktionen bereitstellt.
export const AuthContext = createContext({
	user: null,         // Speichert die Benutzerinformationen (z.B. Benutzername)
	encryptionKey: null, // Speichert den abgeleiteten Verschlüsselungsschlüssel
	login: async (username, masterPassword, saltBase64, token) => {}, // Methode zum Anmelden des Benutzers und Ableiten des Schlüssels
	logout: () => {},     // Methode zum Abmelden des Benutzers
	isAuthenticated: false, // Zeigt an, ob der Benutzer authentifiziert ist
});

// AuthProvider-Komponente umschließt die Anwendung und stellt den Authentifizierungskontext bereit.
export const AuthProvider = ({ children }) => {
	const [user, setUser] = useState(null); // Zustand für den angemeldeten Benutzer
	const [isAuthenticated, setIsAuthenticated] = useState(false); // Zustand für den Authentifizierungsstatus
	const [loadingAuth, setLoadingAuth] = useState(true); // Zustand für den Ladezustand der Authentifizierung
	const [encryptionKey, setEncryptionKey] = useState(null); // Zustand für den Verschlüsselungsschlüssel

	// loadAuthStatus überprüft den lokalen Speicher auf einen vorhandenen Token, um den Authentifizierungsstatus wiederherzustellen.
	const loadAuthStatus = async () => {
		const storedToken = localStorage.getItem('access_token');
		if (storedToken) {
			setAuthToken(storedToken); // Setze den Token im API-Service
			// In einer Produktions-App MUSS der Token gegen das Backend validiert und Benutzerdetails geladen werden!
			setUser({}); // Setze einen Platzhalter-Benutzer, um isAuthenticated auf true zu setzen
			setIsAuthenticated(true);
		} else {
			setAuthToken(null); // Stelle sicher, dass der Token in api.js null ist
			setUser(null);      // Kein Token im localStorage, Benutzer ist nicht angemeldet
			setIsAuthenticated(false);
		}
		// Der encryptionKey kann hier NICHT wiederhergestellt werden, da er nicht im Local Storage gespeichert wird.
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

      setUser({ username }); // Setzt den Benutzerstatus

    } catch (error) {
      // Fehlerbehandlung: Schlüssel und Benutzerinformationen zurücksetzen
      setEncryptionKey(null);
      setUser(null);
      setAuthToken(null); // Stelle sicher, dass der Token bei Fehlern entfernt wird
      throw error; // Fehler weiterleiten
    }
  };

	// logout-Funktion meldet den Benutzer ab und löscht Authentifizierungsstatus und Schlüssel.
	const logout = () => {
		setUser(null);                 // Benutzernull setzen
		setEncryptionKey(null);        // Verschlüsselungsschlüssel löschen
		setIsAuthenticated(false);     // Authentifizierungsstatus auf false setzen
		setAuthToken(null);            // Token auf null setzen über die api.js Funktion
	};

	// Zeigt einen Ladezustand an, während der Authentifizierungsstatus geprüft wird.
	if (loadingAuth) {
		return <div>Lade Authentifizierung...</div>; // Oder eine bessere Ladeanzeige (z.B. Spinner)
	}

	return (
		<AuthContext.Provider value={{ user, encryptionKey, login, logout, isAuthenticated, loadingAuth }}>
			{children}
		</AuthContext.Provider>
	);
};

// Custom hook useAuth erleichtert den Zugriff auf den AuthContext in funktionalen Komponenten.
export const useAuth = () => {
  return useContext(AuthContext);
}; 