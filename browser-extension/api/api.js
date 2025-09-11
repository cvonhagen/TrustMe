import axios from 'axios';

// Backend API base URL - matches TrustMe backend configuration
const API_BASE_URL = 'http://localhost:8080/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Function to get JWT token (stored securely in extension storage)
const getAuthToken = async () => {
  // Implement logic to get token from chrome.storage.local
  return new Promise((resolve, reject) => {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get(['token'], (result) => {
        // Note: The Go backend returns 'token', not 'access_token'
        resolve(result.token);
      });
    } else {
      // Not running in extension context, might use localStorage for development
      // Or reject if token is essential and not available
      const token = localStorage.getItem('token'); // Use 'token' for consistency with backend
      if (token) {
        resolve(token);
      } else {
        // In a real extension, you might want to redirect to login or handle this differently
        console.warn("Auth token not found in localStorage. Not in extension context?");
        resolve(null); // Resolve with null if no token found
      }
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
  }, error => {
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
export const createPasswordExtension = (passwordData) => api.post('/passwords', passwordData);
export const updatePasswordExtension = (passwordId, passwordData) => api.put(`/passwords/${passwordId}`, passwordData);
export const deletePasswordExtension = (passwordId) => api.delete(`/passwords/${passwordId}`);

// Two-Factor Authentication (placeholders)
// export const verify2FAExtension = (codeData) => api.post('/auth/2fa/verify', codeData);

export default api; 