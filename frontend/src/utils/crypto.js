/* eslint-disable no-useless-catch */
// Entferne den CryptoJS Import
// import CryptoJS from 'crypto-js';
// Importiere die benötigten Module von crypto-js nicht mehr
// import 'crypto-js/aes';
// import 'crypto-js/mode-gcm';
// import 'crypto-js/enc-base64';

// Funktion zur Ableitung eines Schlüssels aus dem Master-Passwort und Salt unter Verwendung der Web Crypto API (PBKDF2)
// Muss dieselben Parameter (Salt, Iterationen, Schlüssellänge, Hash) verwenden wie das Backend
// Hinweis: Das Salt muss vom Backend beim Login/Registrierung bereitgestellt werden.
export const deriveKeyFromPassword = async (password, saltBase64) => {
  try {
    // Konvertiere Base64 Salt zu ArrayBuffer
    const saltBuffer = Uint8Array.from(atob(saltBase64), c => c.charCodeAt(0));

    // PBKDF2 Parameter (sollten mit dem Backend übereinstimmen - Werte aus backend/security/security.go)
    const iterations = 250000; // pbkdf2Iterations
    const keyLength = 32; // pbkdf2KeyLen in Bytes (für AES-256)
    // Der Hash-Algorithmus sollte ebenfalls mit dem Backend übereinstimmen
    const hashAlgorithm = 'SHA-256';

    // Importiere das Passwort als Schlüsselmaterial
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(password),
      'PBKDF2',
      false, // Nicht extrahierbar
      ['deriveBits', 'deriveKey']
    );

    // Leite den Schlüssel mit PBKDF2 ab
    const derivedKey = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: saltBuffer,
        iterations: iterations,
        hash: hashAlgorithm,
      },
      keyMaterial,
      {
        name: 'AES-GCM',
        length: keyLength * 8, // Schlüssellänge in Bits
      },
      false, // Nicht extrahierbar
      ['encrypt', 'decrypt'] // Für Verschlüsselung und Entschlüsselung verwendbar
    );

    return derivedKey; // Gebe direkt den CryptoKey zurück

  } catch (error) {
    console.error("Fehler beim Ableiten des Schlüssels:", error);
    throw new Error("Fehler beim Ableiten des Verschlüsselungsschlüssels.");
  }
};

// Funktion zur Verschlüsselung von Daten (AES-GCM) mit Web Crypto API
export const encryptData = async (data, key) => {
  try {
    // Generiere einen zufälligen IV (Initialization Vector) - 12 Bytes für AES-GCM
    const iv = crypto.getRandomValues(new Uint8Array(12));

    // Daten in ArrayBuffer konvertieren
    const encoded = new TextEncoder().encode(data);

    // Verschlüssele die Daten mit AES-GCM
    const ciphertext = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv,
        tagLength: 128, // Der Standardwert für den Authentifizierungs-Tag ist 128 Bits (16 Bytes)
      },
      key, // Dein abgeleiteter CryptoKey
      encoded
    );

    // Der verschlüsselte Text enthält den Chiffretext und den Tag am Ende.
    // Wir müssen den Tag manuell extrahieren, da `encrypt` den Tag als Teil des ciphertext zurückgibt.
    const tagLengthBytes = 16; // 128 Bits = 16 Bytes
    const encryptedBytes = new Uint8Array(ciphertext);
    const encryptedText = encryptedBytes.slice(0, encryptedBytes.length - tagLengthBytes);
    const authTag = encryptedBytes.slice(encryptedBytes.length - tagLengthBytes);

    // Konvertiere alles zu Base64 für die Speicherung/Übertragung
    return {
      encryptedText: btoa(String.fromCharCode(...encryptedText)),
      iv: btoa(String.fromCharCode(...iv)),
      tag: btoa(String.fromCharCode(...authTag)),
    };
  } catch (error) {
    console.error("Fehler beim Verschlüsseln von Daten:", error);
    throw new Error("Fehler beim Verschlüsseln von Daten.");
  }
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