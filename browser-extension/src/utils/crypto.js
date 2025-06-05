import CryptoJS from 'crypto-js';

// Function to derive a key from a password and salt using PBKDF2
export const deriveKeyFromPassword = (password, saltBase64) => {
  // Convert salt from Base64 to WordArray
  const salt = CryptoJS.enc.Base64.parse(saltBase64);

  // PBKDF2 parameters (adjust iterations and key size as needed for security vs performance)
  const iterations = 100000; // Number of iterations
  const keySize = 256 / 32; // Key size in 32-bit words (256 bits)

  const key = CryptoJS.PBKDF2(password, salt, {
    keySize: keySize,
    iterations: iterations
  });

  // Return key as a WordArray
  return key;
};

// Function to encrypt data using AES
export const encryptData = (data, key) => {
  // Generate a random IV (Initialization Vector)
  const iv = CryptoJS.lib.WordArray.random(128 / 8); // 128 bits IV

  // Encrypt the data
  const encrypted = CryptoJS.AES.encrypt(data, key, {
    iv: iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7
  });

  // The encrypted object contains the ciphertext, IV, salt (if used internally by CryptoJS), etc.
  // For storage, we typically need the ciphertext and the IV.
  // CryptoJS includes the IV and salt (if provided during encrypt) in the resulting cipherparams object,
  // and includes them in the default string representation of the ciphertext.
  // The default format is Base64-encoded 'Salted__' + salt + ciphertext.
  // If using a derived key (as here), salt is not included in the encrypted output string by default.
  // We need to ensure IV is available for decryption.

  // Let's return an object containing the Base64 ciphertext and the Base64 IV
  return {
    ciphertext: encrypted.toString(), // Base64 encoded ciphertext + IV (if default format is used)
    iv: iv.toString(CryptoJS.enc.Base64) // Base64 encoded IV
  };
};

// Function to decrypt data using AES
export const decryptData = (encryptedData, key) => {
  // Assuming encryptedData is an object { ciphertext: '...', iv: '...' }
  const { ciphertext, iv: ivBase64 } = encryptedData;

  // Convert Base64 IV to WordArray
  const iv = CryptoJS.enc.Base64.parse(ivBase64);

  // Decrypt the data
  const decrypted = CryptoJS.AES.decrypt(ciphertext, key, {
    iv: iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7
  });

  // Convert the decrypted WordArray to a UTF-8 string
  return decrypted.toString(CryptoJS.enc.Utf8);
};

// Function to hash data (e.g., for master password storage - although PBKDF2 is better for passwords)
export const hashData = (data, salt) => {
  const hashed = CryptoJS.SHA256(data + salt);
  return hashed.toString(CryptoJS.enc.Hex);
};

// Function to generate a random salt
export const generateSalt = (length = 16) => {
    const salt = CryptoJS.lib.WordArray.random(length);
    return salt.toString(CryptoJS.enc.Base64);
}; 