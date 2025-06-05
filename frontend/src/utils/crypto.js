import CryptoJS from 'crypto-js';

// Funktion zur Ableitung eines Schlüssels aus dem Master-Passwort und Salt
// Muss dieselben Parameter (Salt, N, r, p) verwenden wie das Backend Scrypt KDF
// Hinweis: Das Salt muss vom Backend beim Login/Registrierung bereitgestellt werden.
export const deriveKeyFromPassword = (password, saltBase64) => {
  try {
    // Convert base64 salt to WordArray
    const salt = CryptoJS.enc.Base64.parse(saltBase64);

    // Scrypt parameters (should match backend - example values)
    const N = 2**14; // iteration count
    const r = 8;     // block size
    const p = 1;     // parallelism factor
    const keyLength = 256 / 8; // 32 bytes for AES-256

    const derivedKey = CryptoJS.kdf.scrypt(
      password,
      salt,
      {
        N: N,
        r: r,
        p: p,
        keySize: keyLength / 4 // keySize is in 32-bit words
      }
    );
    return derivedKey;
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

    const decrypted = CryptoJS.AES.decrypt(
      {
        ciphertext: ciphertextWithTag
      },
      key,
      {
        iv: iv,
        mode: CryptoJS.mode.GCM,
        padding: CryptoJS.pad.NoPadding
        // GCM requires the tag to be appended to the ciphertext for decryption in this library
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