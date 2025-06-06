import CryptoJS from 'crypto-js';
// import 'crypto-js/lib-typedarrays'; // Might be needed for WordArray - No longer needed with Web Crypto API
// import 'crypto-js/scrypt'; // Corrected Explicit import for Scrypt - No longer needed
// import argon2 from 'argon2-browser'; // Import the argon2-browser library - Removing this
// import loadArgon2idWasm from 'argon2id'; // Import the argon2id library - Removing this

// Funktion zur Ableitung eines Schlüssels aus dem Master-Passwort und Salt unter Verwendung der Web Crypto API (PBKDF2)
// Muss dieselben Parameter (Salt, Iterationen, Schlüssellänge, Hash) verwenden wie das Backend
// Hinweis: Das Salt muss vom Backend beim Login/Registrierung bereitgestellt werden.
export const deriveKeyFromPassword = async (password, saltBase64) => {
  try {
    // Convert base64 salt to ArrayBuffer
    const saltBuffer = Uint8Array.from(atob(saltBase64), c => c.charCodeAt(0));

    // PBKDF2 parameters (should match backend - values from backend/security/security.go)
    const iterations = 250000; // pbkdf2Iterations
    const keyLength = 32; // pbkdf2KeyLen in bytes (for AES-256)
    // Hash algorithm should also match backend
    const hashAlgorithm = 'SHA-256';

    // Import the password as key material
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(password),
      'PBKDF2',
      false, // Not extractable
      ['deriveBits', 'deriveKey']
    );

    // Derive the key using PBKDF2
    const derivedKeyBuffer = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: saltBuffer,
        iterations: iterations,
        hash: hashAlgorithm,
      },
      keyMaterial,
      keyLength * 8 // keyLength in bits
    );

    // Convert the ArrayBuffer to a Uint8Array
    const derivedKeyBytes = new Uint8Array(derivedKeyBuffer);

    // Convert the Uint8Array to a WordArray (CryptoJS format) for compatibility with existing AES-GCM functions
    // Note: Ideally, we would also migrate AES-GCM to Web Crypto API or another library
    const derivedKeyWordArray = CryptoJS.lib.WordArray.create(derivedKeyBytes);

    return derivedKeyWordArray;

  } catch (error) {
    console.error("Error deriving key:", error);
    throw new Error("Failed to derive encryption key.");
  }
};

// Funktion zur Entschlüsselung von Daten (AES-GCM)
// Benötigt den abgeleiteten Schlüssel, den verschlüsselten Text, IV und Tag
export const decryptData = (encryptedTextBase64, ivBase64, tagBase64, key) => {
  try {
    const iv = CryptoJS.enc.Base64.parse(ivBase64);
    const ciphertext = CryptoJS.enc.Base64.parse(encryptedTextBase64);
    const tag = CryptoJS.enc.Base64.parse(tagBase64);

    // Combine ciphertext and tag for CryptoJS AES-GCM format
    // CryptoJS puts the tag at the end of the ciphertext WordArray
    const  ciphertextWithTag = CryptoJS.lib.WordArray.create(
      ciphertext.words.concat(tag.words),
      ciphertext.sigBytes + tag.sigBytes
    );

    // Create CipherParams object
    const cipherParams = CryptoJS.lib.CipherParams.create({
      ciphertext: ciphertextWithTag,
      iv: iv // Include IV in CipherParams as well
      // salt might also be needed here if used during encryption
    });

    const decrypted = CryptoJS.AES.decrypt(
      cipherParams,
      key,
      {
        mode: CryptoJS.mode.GCM,
        padding: CryptoJS.pad.NoPadding
        // The authentication check is implicitly done by the decrypt function in GCM mode
      }
    );

    return decrypted.toString(CryptoJS.enc.Utf8);
  } catch (error) {
    console.error("Error decrypting data:", error);
    // Depending on the error (e.g., invalid tag), this might indicate incorrect key/data
    throw new Error("Failed to decrypt data.");
  }
};

// Funktion zur Verschlüsselung von Daten (AES-GCM)
export const encryptData = (data, key) => {
  try {
    // Generiere einen zufälligen IV (Initialization Vector)
    const iv = CryptoJS.lib.WordArray.random(12); // 96 bits für GCM

    // Verschlüssele die Daten
    const encrypted = CryptoJS.AES.encrypt(data, key, {
      iv: iv,
      mode: CryptoJS.mode.GCM,
      padding: CryptoJS.pad.NoPadding
    });

    // Extrahiere den Tag aus dem verschlüsselten Ergebnis
    // In CryptoJS GCM wird der Tag am Ende des ciphertext gespeichert
    const tag = CryptoJS.lib.WordArray.create(
      encrypted.ciphertext.words.slice(-4), // Letzte 4 Wörter sind der Tag
      16 // 128 bits
    );

    // Entferne den Tag aus dem ciphertext
    const ciphertext = CryptoJS.lib.WordArray.create(
      encrypted.ciphertext.words.slice(0, -4),
      encrypted.ciphertext.sigBytes - 16
    );

    // Konvertiere alles zu Base64 für die Übertragung
    return {
      encryptedText: CryptoJS.enc.Base64.stringify(ciphertext),
      iv: CryptoJS.enc.Base64.stringify(iv),
      tag: CryptoJS.enc.Base64.stringify(tag)
    };
  } catch (error) {
    console.error("Error encrypting data:", error);
    throw new Error("Failed to encrypt data.");
  }
};

// Placeholder for encryption if needed client-side (e.g., before sending to backend)
// export const encryptData = (data, key) => { ... }; 