import axios from 'axios';

// Placeholder for backend API base URL
// This should be loaded from environment variables
const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000/api/v1'; // Adjusted for Vite env and typical API prefix

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Function to get JWT token from storage
const getAuthToken = () => {
  // Implement logic to get token from localStorage or sessionStorage
  return localStorage.getItem('access_token'); // Example using localStorage
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

// Two-Factor Authentication (placeholders)
export const setup2FA = () => api.post('/auth/2fa/setup'); // Assuming 2FA endpoints are under /auth
export const verify2FA = (codeData) => api.post('/auth/2fa/verify', codeData);

export const setupTwoFactor = () => api.post('/auth/2fa/setup'); // API call to initiate 2FA setup
export const verifyTwoFactorSetup = (codeData) => api.post('/auth/2fa/verify', codeData); // API call to verify 2FA setup code
export const verifyTwoFactorLogin = (credentials) => api.post('/auth/2fa/login/verify', credentials); // New API call for 2FA verification after login

export default api; 