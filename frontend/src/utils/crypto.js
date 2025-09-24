import CryptoJS from 'crypto-js';
import { argon2id } from '@noble/hashes/argon2';
import { pbkdf2 } from '@noble/hashes/pbkdf2';
import { sha256 } from '@noble/hashes/sha256';
// import 'crypto-js/lib-typedarrays'; // Könnte für WordArray benötigt werden - Mit Web Crypto API nicht mehr nötig
// import 'crypto-js/scrypt'; // Korrigierter expliziter Import für Scrypt - Nicht mehr nötig
// import argon2 from 'argon2-browser'; // Importiere die argon2-browser Bibliothek - Entferne dies
// import loadArgon2idWasm from 'argon2id'; // Importiere die argon2id Bibliothek - Entferne dies

// Kryptographische Algorithmus-Konfiguration
const algorithm = 'PBKDF2';
const iterations = 250000; // Anzahl der Iterationen, sollte mit dem Backend übereinstimmen (Legacy)
const hash = 'SHA-256';  // Hash-Algorithmus
const length = 256;       // Schlüssellänge in Bits (für AES-256)

// Argon2id-Parameter nach OWASP-Standards (Primary)
const argon2idConfig = {
  t: 3,        // OWASP-Empfehlung: time=3 für optimale Sicherheit
  m: 64 * 1024, // 64 MB Memory: Balance zwischen Sicherheit und Browser-Performance
  p: 4,        // 4 parallele Threads für moderne Multi-Core-CPUs
};

// generateSalt erzeugt einen zufälligen Salt und kodiert ihn als Base64-String.
export const generateSalt = () => {
  const saltBytes = crypto.getRandomValues(new Uint8Array(16)); // 16 Bytes für den Salt
  return btoa(String.fromCharCode(...saltBytes)); // Base64-Kodierung
};

// deriveKeyFromPasswordArgon2id leitet einen kryptografischen Schlüssel mit Argon2id ab
// Moderner Standard nach OWASP-Empfehlungen für maximale Sicherheit
export const deriveKeyFromPasswordArgon2id = async (password, saltBase64) => {
  const passwordBuffer = new TextEncoder().encode(password);
  const saltBuffer = Uint8Array.from(atob(saltBase64), c => c.charCodeAt(0));

  // Argon2id-Hash mit OWASP-Parametern
  const hash = argon2id(passwordBuffer, saltBuffer, {
    t: 3,        // OWASP time=3
    m: 64 * 1024, // 64 MB Memory
    p: 4,        // 4 parallele Threads
    dkLen: 32    // 32 Bytes Output
  });

  // Hash als CryptoKey für AES-GCM importieren
  const derivedKey = await crypto.subtle.importKey(
    'raw',
    hash,
    { name: 'AES-GCM', length: 256 },
    false, // Nicht extrahierbar
    ['encrypt', 'decrypt']
  );

  return derivedKey;
};

// deriveKeyFromPasswordUniversal wählt automatisch das beste verfügbare Verfahren
// Bevorzugt Argon2id, fällt zurück auf PBKDF2 bei Fehlern
// Rückgabe: { key, usedMethod }
export const deriveKeyFromPasswordUniversal = async (password, saltBase64, preferredMethod = 'argon2id') => {
  try {
    if (preferredMethod === 'argon2id') {
      const key = await deriveKeyFromPasswordArgon2id(password, saltBase64);
      return { key, usedMethod: 'argon2id' };
    } else {
      const key = await deriveKeyFromPassword(password, saltBase64);
      return { key, usedMethod: 'pbkdf2' };
    }
  } catch (error) {
    // Fallback auf PBKDF2 wenn Argon2id fehlschlägt
    console.warn('Fallback von Argon2id zu PBKDF2:', error);
    try {
      const key = await deriveKeyFromPassword(password, saltBase64);
      return { key, usedMethod: 'pbkdf2' };
    } catch (fallbackError) {
      console.error('Beide Key-Derivation-Verfahren fehlgeschlagen:', fallbackError);
      throw new Error('Key-Derivation fehlgeschlagen');
    }
  }
};

// deriveKeyFromPassword leitet einen kryptografischen Schlüssel aus einem Passwort und Salt ab (Legacy)
// DEPRECATED: Nur für Backward-Compatibility - Neue Implementierungen sollten deriveKeyFromPasswordArgon2id verwenden
// Dies wird für die Verschlüsselung und Entschlüsselung von Daten verwendet.
export const deriveKeyFromPassword = async (password, saltBase64) => {
  const passwordBuffer = new TextEncoder().encode(password);
  const saltBuffer = Uint8Array.from(atob(saltBase64), c => c.charCodeAt(0)); // Base64 dekodieren

  // Importiere das Master-Passwort als KryptoKey
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    { name: algorithm },
    false, // Nicht extrahierbar
    ['deriveBits', 'deriveKey']
  );

  // Leite den Verschlüsselungsschlüssel ab
  const derivedKey = await crypto.subtle.deriveKey(
    {
      name: algorithm,
      salt: saltBuffer,
      iterations: iterations,
      hash: hash,
    },
    keyMaterial,
    { name: 'AES-GCM', length: length }, // AES-GCM für Verschlüsselung/Entschlüsselung
    false, // Nicht extrahierbar
    ['encrypt', 'decrypt']
  );

  return derivedKey;
};

// encryptData verschlüsselt Klartextdaten mit AES-GCM.
// Gibt den verschlüsselten Text, Initialisierungsvektor (IV) und Authentifizierungs-Tag als Base64-Strings zurück.
export const encryptData = async (plainText, key) => {
  const iv = crypto.getRandomValues(new Uint8Array(12)); // 12 Bytes für AES-GCM IV
  const encoded = new TextEncoder().encode(plainText);

  // Verschlüsseln der Daten
  const cipher = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv,
    },
    key,
    encoded
  );

  // Den verschlüsselten Text und den Tag trennen (implizit in AES-GCM)
  // Die Rückgabe von crypto.subtle.encrypt enthält den verschlüsselten Text und den Tag. 
  // Wir konvertieren den ArrayBuffer in einen Uint8Array.
  const cipherArray = new Uint8Array(cipher);

  // Da der Tag von der Web Crypto API automatisch angehängt wird, 
  // müssen wir ihn nicht explizit trennen, wenn wir den gesamten 
  // ArrayBuffer als verschlüsselten Text behandeln. 
  // Um den Tag später zu verifizieren, muss der vollständige Ciphertext 
  // (einschließlich des angehängten Tags) an die Entschlüsselungsfunktion übergeben werden.

  return {
    encryptedText: btoa(String.fromCharCode(...cipherArray)), // Base64-kodierter Ciphertext (enthält den Tag)
    iv: btoa(String.fromCharCode(...iv)),                 // Base64-kodierter IV
    tag: '' // Tag ist Teil des encryptedText und wird nicht separat zurückgegeben
  };
};



// generatePassword generiert ein zufälliges Passwort basierend auf den angegebenen Kriterien.
export const generatePassword = (length = 16, includeUppercase = true, includeLowercase = true, includeNumbers = true, includeSymbols = true) => {
  const uppercaseChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercaseChars = 'abcdefghijklmnopqrstuvwxyz';
  const numberChars = '0123456789';
  const symbolChars = '!@#$%^&*()_+-=[]{};:,.<>/?';

  let allChars = '';
  let generatedPassword = '';

  // Sicherstellen, dass mindestens ein Zeichentyp ausgewählt ist
  if (!includeUppercase && !includeLowercase && !includeNumbers && !includeSymbols) {
    throw new Error("Mindestens ein Zeichentyp muss für die Passwortgenerierung ausgewählt werden.");
  }

  // Verfügbare Zeichen basierend auf den Optionen aufbauen
  if (includeUppercase) {
    allChars += uppercaseChars;
    generatedPassword += uppercaseChars[Math.floor(Math.random() * uppercaseChars.length)]; // Mindestens einen Großbuchstaben hinzufügen
  }
  if (includeLowercase) {
    allChars += lowercaseChars;
    generatedPassword += lowercaseChars[Math.floor(Math.random() * lowercaseChars.length)]; // Mindestens einen Kleinbuchstaben hinzufügen
  }
  if (includeNumbers) {
    allChars += numberChars;
    generatedPassword += numberChars[Math.floor(Math.random() * numberChars.length)]; // Mindestens eine Zahl hinzufügen
  }
  if (includeSymbols) {
    allChars += symbolChars;
    generatedPassword += symbolChars[Math.floor(Math.random() * symbolChars.length)]; // Mindestens ein Symbol hinzufügen
  }

  // Rest des Passworts mit zufälligen Zeichen aus allen ausgewählten Typen auffüllen
  for (let i = generatedPassword.length; i < length; i++) {
    generatedPassword += allChars[Math.floor(Math.random() * allChars.length)];
  }

  // Passwort mischen, um die Reihenfolge der obligatorischen Zeichen zu randomisieren
  generatedPassword = generatedPassword.split('').sort(() => Math.random() - 0.5).join('');

  return generatedPassword;
};

// Funktion zur Entschlüsselung von Daten (AES-GCM) mit Web Crypto API
export const decryptData = async (encryptedTextBase64, ivBase64, tagBase64, key) => {
  try {
    console.log('DEBUG (decryptData): encryptedTextBase64:', encryptedTextBase64);
    console.log('DEBUG (decryptData): ivBase64:', ivBase64);
    console.log('DEBUG (decryptData): tagBase64:', tagBase64);
    console.log('DEBUG (decryptData): key:', key); // Dies sollte ein CryptoKey-Objekt sein

    // Konvertiere Base64 zurück zu Uint8Arrays
    const iv = Uint8Array.from(atob(ivBase64), c => c.charCodeAt(0));
    const encryptedText = Uint8Array.from(atob(encryptedTextBase64), c => c.charCodeAt(0));
    const tag = Uint8Array.from(atob(tagBase64), c => c.charCodeAt(0));

    // Kombiniere verschlüsselten Text und Tag für die Entschlüsselung
    const combined = new Uint8Array(encryptedText.length + tag.length);
    combined.set(encryptedText);
    combined.set(tag, encryptedText.length);

    // Entschlüssele die Daten mit AES-GCM
    const decrypted = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv,
        tagLength: 128, // Der Standardwert für den Authentifizierungs-Tag ist 128 Bits
      },
      key, // Dein abgeleiteter CryptoKey
      combined
    );

    // Konvertiere den ArrayBuffer zurück zu einer Zeichenkette
    return new TextDecoder().decode(decrypted);
  } catch (error) {
    console.error("Fehler beim Entschlüsseln von Daten:", error);
    throw new Error("Fehler beim Entschlüsseln von Daten.");
  }
};

// Platzhalter für die Verschlüsselung, falls client-seitig benötigt (z.B. vor dem Senden an das Backend)
// export const encryptData = (data, key) => { ... };