import React, { createContext, useState, useContext } from 'react';
import { deriveKeyFromPassword } from './utils/crypto'; // Import the key derivation function

const AuthContext = createContext({
  user: null,
  encryptionKey: null, // Store the derived encryption key here
  login: async (username, masterPassword, saltBase64) => {}, // Method to handle login and key derivation
  logout: () => {}, // Method to handle logout
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // You might store user details here if needed
  const [encryptionKey, setEncryptionKey] = useState(null); // State to hold the encryption key

  // Modified login function to handle key derivation
  const login = async (username, masterPassword, saltBase64) => {
    try {
      // Derive the encryption key client-side
      const derivedKey = deriveKeyFromPassword(masterPassword, saltBase64);
      setEncryptionKey(derivedKey); // Store the derived key in state

      // In a real app, you would also fetch user details from the backend after successful API login
      setUser({ username }); // Placeholder user object

      // Note: The actual API login call happens in LoginPage.jsx. 
      // This context's login function is mainly for managing the *state* of authentication and the key.

      console.log('Encryption key derived and stored in context.');

    } catch (error) {
      console.error('Failed to derive encryption key during login:', error);
      // Handle error (e.g., clear user/key, show error message)
      setEncryptionKey(null);
      setUser(null);
      throw error; // Re-throw the error for the UI to handle
    }
  };

  const logout = () => {
    // Clear authentication state and encryption key
    setUser(null);
    setEncryptionKey(null);
    // Also clear any stored tokens (e.g., from localStorage)
    localStorage.removeItem('access_token');
    console.log('User logged out and encryption key cleared.');
  };

  return (
    <AuthContext.Provider value={{ user, encryptionKey, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}; 