import CryptoJS from 'crypto-js';
import { argon2id } from '@noble/hashes/argon2';
import { pbkdf2 } from '@noble/hashes/pbkdf2';
import { sha256 } from '@noble/hashes/sha256';

// Kryptographische Algorithmus-Konfiguration
const pbkdf2Config = {
  iterations: 250000, // Legacy PBKDF2-Iterationen
  keyLength: 32       // 32 Bytes für AES-256
};

// Argon2id-Parameter nach OWASP-Standards (Primary)
const argon2idConfig = {
  t: 3,        // OWASP-Empfehlung: time=3 für optimale Sicherheit
  m: 64 * 1024, // 64 MB Memory: Balance zwischen Sicherheit und Browser-Performance
  p: 4,        // 4 parallele Threads für moderne Multi-Core-CPUs
};

// deriveKeyFromPasswordArgon2id erzeugt einen Schlüssel mit Argon2id (Modern)
export const deriveKeyFromPasswordArgon2id = async (password, saltBase64) => {
  try {
    const passwordBuffer = new TextEncoder().encode(password);
    const saltBuffer = Uint8Array.from(atob(saltBase64), c => c.charCodeAt(0));

    // Argon2id-Hash mit OWASP-Parametern
    const hash = argon2id(passwordBuffer, saltBuffer, {
      t: argon2idConfig.t,
      m: argon2idConfig.m,
      p: argon2idConfig.p,
      dkLen: 32
    });

    // Hash als CryptoKey für Web Crypto API importieren
    const derivedKey = await crypto.subtle.importKey(
      'raw',
      hash,
      { name: 'AES-GCM', length: 256 },
      false, // Nicht extrahierbar
      ['encrypt', 'decrypt']
    );

    return derivedKey;
  } catch (error) {
    console.error('Fehler bei Argon2id Key-Derivation:', error);
    throw new Error('Argon2id Key-Derivation fehlgeschlagen');
  }
};

// deriveKeyFromPasswordPBKDF2 erzeugt einen Schlüssel mit PBKDF2 (Legacy)
export const deriveKeyFromPasswordPBKDF2 = async (password, saltBase64) => {
  try {
    const passwordBuffer = new TextEncoder().encode(password);
    const saltBuffer = Uint8Array.from(atob(saltBase64), c => c.charCodeAt(0));

    // PBKDF2-Hash mit Legacy-Parametern
    const hash = pbkdf2(sha256, passwordBuffer, saltBuffer, {
      c: pbkdf2Config.iterations,
      dkLen: pbkdf2Config.keyLength
    });

    // Hash als CryptoKey für Web Crypto API importieren
    const derivedKey = await crypto.subtle.importKey(
      'raw',
      hash,
      { name: 'AES-GCM', length: 256 },
      false, // Nicht extrahierbar
      ['encrypt', 'decrypt']
    );

    return derivedKey;
  } catch (error) {
    console.error('Fehler bei PBKDF2 Key-Derivation:', error);
    throw new Error('PBKDF2 Key-Derivation fehlgeschlagen');
  }
};

// deriveKeyFromPasswordUniversal wählt automatisch das beste verfügbare Verfahren
// Bevorzugt Argon2id, fällt zurück auf PBKDF2 bei Fehlern
export const deriveKeyFromPasswordUniversal = async (password, saltBase64, preferredMethod = 'argon2id') => {
  try {
    if (preferredMethod === 'argon2id') {
      const key = await deriveKeyFromPasswordArgon2id(password, saltBase64);
      return { key, usedMethod: 'argon2id' };
    } else {
      const key = await deriveKeyFromPasswordPBKDF2(password, saltBase64);
      return { key, usedMethod: 'pbkdf2' };
    }
  } catch (error) {
    // Fallback auf PBKDF2 wenn Argon2id fehlschlägt
    console.warn('Fallback von Argon2id zu PBKDF2:', error);
    try {
      const key = await deriveKeyFromPasswordPBKDF2(password, saltBase64);
      return { key, usedMethod: 'pbkdf2' };
    } catch (fallbackError) {
      console.error('Beide Key-Derivation-Verfahren fehlgeschlagen:', fallbackError);
      throw new Error('Key-Derivation fehlgeschlagen');
    }
  }
};

// deriveKeyFromPassword (Legacy-Interface für Backward-Compatibility)
// DEPRECATED: Nutzt das alte Scrypt-Interface, sollte durch deriveKeyFromPasswordUniversal ersetzt werden
export const deriveKeyFromPassword = async (password, saltBase64) => {
  console.warn('DEPRECATED: deriveKeyFromPassword - Verwende deriveKeyFromPasswordUniversal');
  
  // Für Backward-Compatibility: Fallback auf universelle Funktion
  const result = await deriveKeyFromPasswordUniversal(password, saltBase64, 'pbkdf2');
  
  // CryptoJS-WordArray für alte Interface-Kompatibilität zurückgeben
  // Konvertiere CryptoKey zu Bytes und dann zu WordArray
  const keyBytes = await crypto.subtle.exportKey('raw', result.key);
  const keyWordArray = CryptoJS.lib.WordArray.create(new Uint32Array(keyBytes));
  
  return keyWordArray;
};

// decryptDataModern entschlüsselt Daten mit Web Crypto API (AES-GCM)
export const decryptDataModern = async (encryptedTextBase64, ivBase64, key) => {
  try {
    const encryptedData = Uint8Array.from(atob(encryptedTextBase64), c => c.charCodeAt(0));
    const iv = Uint8Array.from(atob(ivBase64), c => c.charCodeAt(0));

    // Entschlüsseln mit Web Crypto API
    const decrypted = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv,
        tagLength: 128 // 128-bit Authentication Tag
      },
      key,
      encryptedData
    );

    return new TextDecoder().decode(decrypted);
  } catch (error) {
    console.error('Fehler beim Entschlüsseln (Modern):', error);
    throw new Error('Entschlüsselung fehlgeschlagen');
  }
};

// encryptDataModern verschlüsselt Daten mit Web Crypto API (AES-GCM)
export const encryptDataModern = async (data, key) => {
  try {
    const iv = crypto.getRandomValues(new Uint8Array(12)); // 12 Bytes für GCM
    const encoded = new TextEncoder().encode(data);

    // Verschlüsseln mit Web Crypto API
    const encrypted = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv,
        tagLength: 128
      },
      key,
      encoded
    );

    // Encrypted enthält automatisch den Authentication Tag
    const encryptedArray = new Uint8Array(encrypted);

    return {
      encryptedText: btoa(String.fromCharCode(...encryptedArray)),
      iv: btoa(String.fromCharCode(...iv)),
      tag: '' // Tag ist in encryptedText eingebettet
    };
  } catch (error) {
    console.error('Fehler beim Verschlüsseln (Modern):', error);
    throw new Error('Verschlüsselung fehlgeschlagen');
  }
};
// decryptData (Legacy-Interface für Backward-Compatibility)
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

// encryptData (Legacy-Interface für Backward-Compatibility)
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