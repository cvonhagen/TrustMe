import axios from 'axios';

// Placeholder for backend API base URL loaded from extension storage or config
// For local development, you might hardcode it or load from a local config file
const API_BASE_URL = 'http://localhost:8000/api/v1'; // Example local backend URL

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Function to get JWT token (stored securely in extension storage)
const getAuthToken = async () => {
  // Implement logic to get token from chrome.storage.local
  return new Promise((resolve) => {
    if (chrome.storage && chrome.storage.local) {
      chrome.storage.local.get(['access_token'], (result) => {
        resolve(result.access_token);
      });
    } else {
      // Not running in extension context, might use localStorage for development
      resolve(localStorage.getItem('access_token'));
    }
  });
};

// Add a request interceptor to include the auth token
api.interceptors.request.use(
  async config => {
    const token = await getAuthToken();
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },\n  error => {
    return Promise.reject(error);
  }
);

// Placeholder API functions for extension

// Authentication (might differ slightly for extension)
export const loginUserExtension = (credentials) => api.post('/auth/login', credentials);
// Note: Registration might happen only via the web app

// Passwords
export const getPasswordsExtension = () => api.get('/passwords');
export const getPasswordByIdExtension = (passwordId) => api.get(`/passwords/${passwordId}`);
// Add other password related API calls as needed for the extension (create, update, delete - maybe limited functionality in extension?)

// Two-Factor Authentication (placeholders)
// export const verify2FAExtension = (codeData) => api.post('/auth/2fa/verify', codeData);

export default api; 