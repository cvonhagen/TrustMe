import axios from 'axios';

// API-Service für Backend-Kommunikation mit automatischer JWT-Authentifizierung
const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3030/api/v1';

let authToken = null; // Globaler JWT-Token für Authentifizierung

// Axios-Instanz mit Basis-Konfiguration
const api = axios.create({
	baseURL: API_BASE_URL,
	headers: {
		'Content-Type': 'application/json',
	},
});

// Token-Management: Speichert JWT in Memory und localStorage
export const setAuthToken = (token) => {
  authToken = token;
  if (token) {
    localStorage.setItem('access_token', token); // Persistierung für App-Neustarts
  } else {
    localStorage.removeItem('access_token');
  }
};

// Request-Interceptor: Fügt automatisch Authorization-Header hinzu
api.interceptors.request.use(
	config => {
		// Öffentliche Routen ohne Authentifizierung
		const publicRoutes = ['/auth/login', '/auth/register'];
		const isPublicRoute = publicRoutes.some(route => config.url.endsWith(route));

    const token = authToken;

    // JWT-Header für geschützte Routen
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

// === AUTHENTIFIZIERUNG ===
export const registerUser = (userData) => { return api.post('/auth/register', userData); };
export const loginUser = (credentials) => { return api.post('/auth/login', credentials); };

// === PASSWORT-VERWALTUNG ===
export const getPasswords = () => { return api.get('/passwords'); }; // Alle verschlüsselten Passwörter
export const createPassword = (passwordData) => { return api.post('/passwords', passwordData); };
export const addPassword = createPassword; // Alias
export const getPasswordById = (passwordId) => { return api.get(`/passwords/${passwordId}`); };
export const updatePassword = (passwordId, passwordData) => { return api.put(`/passwords/${passwordId}`, passwordData); };
export const deletePassword = (passwordId) => { return api.delete(`/passwords/${passwordId}`); };

// === ZWEI-FAKTOR-AUTHENTIFIZIERUNG ===
export const setup2FA = () => { return api.post('/two-factor/setup'); }; // QR-Code generieren
export const verify2FA = (codeData) => { return api.post('/two-factor/setup/verify', codeData); }; // Setup bestätigen

export const setupTwoFactor = () => { return api.post('/two-factor/setup'); }; // Alias
export const verifyTwoFactorSetup = (codeData) => { return api.post('/two-factor/setup/verify', codeData); }; // Alias

export const verifyTwoFactorLogin = (credentials) => { return api.post('/two-factor/verify', credentials); }; // Login-2FA

// API-Funktionen für Account-Verwaltung
// deleteAccount: Löscht den Account des angemeldeten Benutzers permanent.
export const deleteAccount = () => { return api.delete('/auth/account'); };

// validateToken: Prüft, ob der aktuelle Token noch gültig ist
export const validateToken = () => { return api.get('/auth/validate'); };



export default api; 