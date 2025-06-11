import CryptoJS from 'crypto-js';
// import 'crypto-js/lib-typedarrays'; // Könnte für WordArray benötigt werden - Mit Web Crypto API nicht mehr nötig
// import 'crypto-js/scrypt'; // Korrigierter expliziter Import für Scrypt - Nicht mehr nötig
// import argon2 from 'argon2-browser'; // Importiere die argon2-browser Bibliothek - Entferne dies
// import loadArgon2idWasm from 'argon2id'; // Importiere die argon2id Bibliothek - Entferne dies

const algorithm = 'PBKDF2';
const iterations = 250000; // Anzahl der Iterationen, sollte mit dem Backend übereinstimmen
const hash = 'SHA-256';  // Hash-Algorithmus
const length = 256;       // Schlüssellänge in Bits (für AES-256)

// generateSalt erzeugt einen zufälligen Salt und kodiert ihn als Base64-String.
export const generateSalt = () => {
  const saltBytes = crypto.getRandomValues(new Uint8Array(16)); // 16 Bytes für den Salt
  return btoa(String.fromCharCode(...saltBytes)); // Base64-Kodierung
};

// deriveKeyFromPassword leitet einen kryptografischen Schlüssel aus einem Passwort und Salt ab.
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

// decryptData entschlüsselt AES-GCM verschlüsselte Daten.
// Erfordert den verschlüsselten Text, IV, Tag (der Teil des verschlüsselten Textes sein sollte) und den Schlüssel.
export const decryptData = async (encryptedTextBase64, ivBase64, tagBase64, key) => {
  const encryptedBytes = Uint8Array.from(atob(encryptedTextBase64), c => c.charCodeAt(0));
  const ivBytes = Uint8Array.from(atob(ivBase64), c => c.charCodeAt(0));

  // Entschlüsseln der Daten
  const decrypted = await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: ivBytes,
    },
    key,
    encryptedBytes // Beinhaltet den Tag
  );

  return new TextDecoder().decode(decrypted);
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