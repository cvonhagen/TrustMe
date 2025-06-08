import axios from 'axios';

// API Basis-URL für das Backend. Aus Umgebungsvariablen geladen oder Fallback auf localhost.
const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3030/api/v1';

let authToken = null; // Globale Variable zur Speicherung des Authentifizierungstokens

// Erstelle eine Axios-Instanz mit der konfigurierten Basis-URL und Headern.
const api = axios.create({
	baseURL: API_BASE_URL,
	headers: {
		'Content-Type': 'application/json',
	},
});

// setAuthToken speichert den Token global und im Local Storage.
export const setAuthToken = (token) => {
  authToken = token;
  if (token) {
    localStorage.setItem('access_token', token); // Token im Local Storage speichern
  } else {
    localStorage.removeItem('access_token');     // Token aus Local Storage entfernen
  }
};

// Axios Interceptor für die automatische Authentifizierung bei API-Anfragen.
// Fügt den Authorization-Header hinzu, außer bei öffentlichen Routen.
api.interceptors.request.use(
	config => {
		// Routen definieren, die keine Authentifizierung erfordern (öffentlich)
		const publicRoutes = ['/auth/login', '/auth/register'];
		// Prüfen, ob die aktuelle Anfrage eine öffentliche Route ist
		const isPublicRoute = publicRoutes.some(route => config.url.endsWith(route));

    const token = authToken; // Aktuellen Authentifizierungstoken abrufen

    // Wenn ein Token vorhanden ist und es keine öffentliche Route ist, setze den Authorization-Header.
    if (token && !isPublicRoute) {
      config.headers['Authorization'] = `Bearer ${token}`;
    } else if (isPublicRoute) {
      // Für öffentliche Routen sicherstellen, dass kein Authorization-Header gesetzt ist.
      delete config.headers['Authorization'];
    }
    return config; // Konfigurierte Anfrage zurückgeben
  },
  error => {
    // Fehlerbehandlung bei der Anfragevorbereitung
    return Promise.reject(error);
  }
);

// API-Funktionen für die Authentifizierung
// registerUser: Registriert einen neuen Benutzer.
export const registerUser = (userData) => { return api.post('/auth/register', userData); };
// loginUser: Meldet einen Benutzer an und erhält einen Token.
export const loginUser = (credentials) => { return api.post('/auth/login', credentials); };

// API-Funktionen für die Passwortverwaltung
// getPasswords: Ruft alle Passwörter des angemeldeten Benutzers ab.
export const getPasswords = () => { return api.get('/passwords'); };
// createPassword: Erstellt einen neuen Passwort-Eintrag.
export const createPassword = (passwordData) => { return api.post('/passwords', passwordData); };
export const addPassword = createPassword; // Alias für createPassword
// getPasswordById: Ruft ein spezifisches Passwort anhand seiner ID ab.
export const getPasswordById = (passwordId) => { return api.get(`/passwords/${passwordId}`); };
// updatePassword: Aktualisiert einen bestehenden Passwort-Eintrag.
export const updatePassword = (passwordId, passwordData) => { return api.put(`/passwords/${passwordId}`, passwordData); };
// deletePassword: Löscht einen Passwort-Eintrag.
export const deletePassword = (passwordId) => { return api.delete(`/passwords/${passwordId}`); };

// API-Funktionen für die Zwei-Faktor-Authentifizierung (2FA)
// setup2FA: Initiert den 2FA-Einrichtungsprozess.
export const setup2FA = () => { return api.post('/two-factor/setup'); };
// verify2FA: Verifiziert einen 2FA-Einrichtungscode.
export const verify2FA = (codeData) => { return api.post('/two-factor/setup/verify', codeData); };

export const setupTwoFactor = () => { return api.post('/two-factor/setup'); }; // Alias für setup2FA
export const verifyTwoFactorSetup = (codeData) => { return api.post('/two-factor/setup/verify', codeData); }; // Alias für verify2FA

// verifyTwoFactorLogin: Verifiziert den 2FA-Code während des Login-Prozesses.
export const verifyTwoFactorLogin = (credentials) => { return api.post('/two-factor/verify', credentials); };

export default api; 