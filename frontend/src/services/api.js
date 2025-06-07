import axios from 'axios';

// Platzhalter für die Backend API Basis-URL
// Dies sollte aus Umgebungsvariablen geladen werden
const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3030/api/v1';

let authToken = null; // Variable zur Speicherung des Tokens

const api = axios.create({
	baseURL: API_BASE_URL,
	headers: {
		'Content-Type': 'application/json',
	},
});

// Funktion zum Setzen des Tokens
export const setAuthToken = (token) => {
  authToken = token;
  if (token) {
    localStorage.setItem('access_token', token);
    console.log('setAuthToken: Token set in global variable and localStorage.', token); // Debugging
  } else {
    localStorage.removeItem('access_token');
    console.log('setAuthToken: Token cleared from global variable and localStorage.'); // Debugging
  }
};

// Axios Interceptor für die Authentifizierung
api.interceptors.request.use(
	config => {
		// Füge den Authorization Header nur hinzu, wenn es sich NICHT um die Login- oder Register-Route handelt
		const publicRoutes = ['/auth/login', '/auth/register'];
		const isPublicRoute = publicRoutes.some(route => config.url.endsWith(route));

    const token = authToken;
    console.log('Axios Interceptor: Using token:', token, 'for URL:', config.url); // Debug-Ausgabe anpassen

    if (token && !isPublicRoute) {
      config.headers['Authorization'] = `Bearer ${token}`;
      console.log('Axios Interceptor: Authorization header set.'); // Debugging
    } else if (isPublicRoute) {
      console.log('Axios Interceptor: Public route, Authorization header NOT set.'); // Debugging
      // Stelle sicher, dass der Header für öffentliche Routen NICHT gesetzt ist
      delete config.headers['Authorization'];
    } else {
      console.log('Axios Interceptor: No token found, Authorization header NOT set.'); // Debugging
    }
    return config;
  },
  error => {
    console.error('Axios Interceptor: Request error:', error); // Debugging
    return Promise.reject(error);
  }
);

// API-Funktionen
// Authentifizierung
export const registerUser = (userData) => { console.log('api.js: registerUser called'); return api.post('/auth/register', userData); }; // Debugging
export const loginUser = (credentials) => { console.log('api.js: loginUser called'); return api.post('/auth/login', credentials); }; // Debugging

// Passwords
export const getPasswords = () => { console.log('api.js: getPasswords called'); return api.get('/passwords'); }; // Debugging
export const createPassword = (passwordData) => { console.log('api.js: createPassword called'); return api.post('/passwords', passwordData); }; // Debugging
export const addPassword = createPassword; // Alias für createPassword
export const getPasswordById = (passwordId) => { console.log('api.js: getPasswordById called', passwordId); return api.get(`/passwords/${passwordId}`); }; // Debugging
export const updatePassword = (passwordId, passwordData) => { console.log('api.js: updatePassword called', passwordId); return api.put(`/passwords/${passwordId}`, passwordData); }; // Debugging
export const deletePassword = (passwordId) => { console.log('api.js: deletePassword called'); return api.delete(`/passwords/${passwordId}`); }; // Debugging

// Two-Factor Authentication
export const setup2FA = () => { console.log('api.js: setup2FA called'); return api.post('/two-factor/setup'); }; // Debugging
export const verify2FA = (codeData) => { console.log('api.js: verify2FA called'); return api.post('/two-factor/setup/verify', codeData); }; // Debugging

export const setupTwoFactor = () => { console.log('api.js: setupTwoFactor called'); return api.post('/two-factor/setup'); }; // Debugging
export const verifyTwoFactorSetup = (codeData) => { console.log('api.js: verifyTwoFactorSetup called'); return api.post('/two-factor/setup/verify', codeData); }; // Debugging

export const verifyTwoFactorLogin = (credentials) => { console.log('api.js: verifyTwoFactorLogin called'); return api.post('/two-factor/verify', credentials); }; // Debugging

export default api; 