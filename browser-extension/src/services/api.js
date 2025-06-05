import axios from 'axios';

// API-Konfiguration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Token-Management
const getAuthToken = async () => {
  try {
    const result = await chrome.storage.local.get(['access_token']);
    return result.access_token;
  } catch (error) {
    console.error('Fehler beim Abrufen des Tokens:', error);
    return null;
  }
};

// Request Interceptor
api.interceptors.request.use(
  async config => {
    const token = await getAuthToken();
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    console.error('Request Interceptor Fehler:', error);
    return Promise.reject(error);
  }
);

// Response Interceptor für Token-Erneuerung und Fehlerbehandlung
api.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;

    // Bei 401 Unauthorized und noch nicht erneut versucht
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Token erneuern oder neu anmelden
        await chrome.storage.local.remove(['access_token', 'encryption_key']);
        // Event an Popup senden, um Login-Dialog zu öffnen
        chrome.runtime.sendMessage({ action: 'AUTH_REQUIRED' });
      } catch (refreshError) {
        console.error('Token-Erneuerung fehlgeschlagen:', refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// API-Endpunkte
export const getPasswordsForUrl = async (url) => {
  try {
    const response = await api.get('/passwords', { 
      params: { url },
      timeout: 5000 // 5 Sekunden Timeout
    });
    return response;
  } catch (error) {
    console.error('Fehler beim Abrufen der Passwörter:', error);
    throw new Error(error.response?.data?.detail || 'Passwörter konnten nicht geladen werden');
  }
};

export const loginUser = async (credentials) => {
  try {
    const response = await api.post('/auth/login', credentials, {
      timeout: 5000
    });
    return response;
  } catch (error) {
    console.error('Login fehlgeschlagen:', error);
    throw new Error(error.response?.data?.detail || 'Login fehlgeschlagen');
  }
};

export const verifyTwoFactorLogin = async (credentials) => {
  try {
    const response = await api.post('/auth/2fa/login/verify', credentials, {
      timeout: 5000
    });
    return response;
  } catch (error) {
    console.error('2FA-Verifizierung fehlgeschlagen:', error);
    throw new Error(error.response?.data?.detail || '2FA-Verifizierung fehlgeschlagen');
  }
};

// Hilfsfunktion zum Überprüfen des Auth-Status
export const checkAuthStatus = async () => {
  try {
    const token = await getAuthToken();
    if (!token) return false;

    // Token validieren
    await api.get('/auth/verify');
    return true;
  } catch (error) {
    console.error('Auth-Status-Prüfung fehlgeschlagen:', error);
    return false;
  }
};

export default api; 