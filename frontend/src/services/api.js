import axios from 'axios';

// Placeholder for backend API base URL
// This should be loaded from environment variables
const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3030/api/v1'; // **ANGEPASST AUF PORT 3030**

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Function to get JWT token from storage
const getAuthToken = () => {
  // Implement logic to get token from localStorage or sessionStorage
  // NOTE: Go backend returns 'token', not 'access_token'
  return localStorage.getItem('token'); // Using 'token' key for consistency
};

// Add a request interceptor to include the auth token
api.interceptors.request.use(
  config => {
    const token = getAuthToken();
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// Placeholder API functions

// Authentication
export const registerUser = (userData) => api.post('/auth/register', userData);
export const loginUser = (credentials) => api.post('/auth/login', credentials);

// Passwords
export const getPasswords = () => api.get('/passwords');
export const createPassword = (passwordData) => api.post('/passwords', passwordData);
export const addPassword = createPassword; // Alias für createPassword
export const getPasswordById = (passwordId) => api.get(`/passwords/${passwordId}`);
export const updatePassword = (passwordId, passwordData) => api.put(`/passwords/${passwordId}`, passwordData);
export const deletePassword = (passwordId) => api.delete(`/passwords/${passwordId}`);

// Two-Factor Authentication
export const setup2FA = () => api.post('/two-factor/setup');
export const verify2FA = (codeData) => api.post('/two-factor/setup/verify', codeData);

export const setupTwoFactor = () => api.post('/two-factor/setup'); // Alias
export const verifyTwoFactorSetup = (codeData) => api.post('/two-factor/setup/verify', codeData); // Alias

export const verifyTwoFactorLogin = (credentials) => api.post('/two-factor/verify', credentials);

export default api; 