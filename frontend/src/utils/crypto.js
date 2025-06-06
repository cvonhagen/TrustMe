import CryptoJS from 'crypto-js';
// import 'crypto-js/lib-typedarrays'; // Könnte für WordArray benötigt werden - Mit Web Crypto API nicht mehr nötig
// import 'crypto-js/scrypt'; // Korrigierter expliziter Import für Scrypt - Nicht mehr nötig
// import argon2 from 'argon2-browser'; // Importiere die argon2-browser Bibliothek - Entferne dies
// import loadArgon2idWasm from 'argon2id'; // Importiere die argon2id Bibliothek - Entferne dies

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
    const derivedKeyBuffer = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: saltBuffer,
        iterations: iterations,
        hash: hashAlgorithm,
      },
      keyMaterial,
      keyLength * 8 // keyLength in Bits
    );

    // Konvertiere den ArrayBuffer zu einem Uint8Array
    const derivedKeyBytes = new Uint8Array(derivedKeyBuffer);

    // Konvertiere das Uint8Array zu einem WordArray (CryptoJS Format) für Kompatibilität mit bestehenden AES-GCM Funktionen
    // Hinweis: Idealerweise würden wir auch AES-GCM zur Web Crypto API oder einer anderen Bibliothek migrieren
    const derivedKeyWordArray = CryptoJS.lib.WordArray.create(derivedKeyBytes);

    return derivedKeyWordArray;

  } catch (error) {
    console.error("Fehler beim Ableiten des Schlüssels:", error);
    throw new Error("Fehler beim Ableiten des Verschlüsselungsschlüssels.");
  }
};

// Funktion zur Entschlüsselung von Daten (AES-GCM)
// Benötigt den abgeleiteten Schlüssel, den verschlüsselten Text, IV und Tag
export const decryptData = (encryptedTextBase64, ivBase64, tagBase64, key) => {
  try {
    const iv = CryptoJS.enc.Base64.parse(ivBase64);
    const ciphertext = CryptoJS.enc.Base64.parse(encryptedTextBase64);
    const tag = CryptoJS.enc.Base64.parse(tagBase64);

    // Kombiniere Chiffretext und Tag für das CryptoJS AES-GCM Format
    // CryptoJS legt den Tag am Ende des Chiffretext WordArray ab
    const  ciphertextWithTag = CryptoJS.lib.WordArray.create(
      ciphertext.words.concat(tag.words),
      ciphertext.sigBytes + tag.sigBytes
    );

    // Erstelle CipherParams Objekt
    const cipherParams = CryptoJS.lib.CipherParams.create({
      ciphertext: ciphertextWithTag,
      iv: iv // Füge auch IV in CipherParams ein
      // salt könnte hier auch benötigt werden, falls bei der Verschlüsselung verwendet
    });

    const decrypted = CryptoJS.AES.decrypt(
      cipherParams,
      key,
      {
        mode: CryptoJS.mode.GCM,
        padding: CryptoJS.pad.NoPadding
        // Die Authentifizierungsprüfung wird implizit von der Entschlüsselungsfunktion im GCM-Modus durchgeführt
      }
    );

    return decrypted.toString(CryptoJS.enc.Utf8);
  } catch (error) {
    console.error("Fehler beim Entschlüsseln von Daten:", error);
    // Abhängig vom Fehler (z.B. ungültiger Tag) könnte dies auf einen falschen Schlüssel/Daten hindeuten
    throw new Error("Fehler beim Entschlüsseln von Daten.");
  }
};

// Funktion zur Verschlüsselung von Daten (AES-GCM)
export const encryptData = (data, key) => {
  try {
    // Generiere einen zufälligen IV (Initialization Vector)
    const iv = CryptoJS.lib.WordArray.random(12); // 96 Bits für GCM

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
      16 // 128 Bits
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
    console.error("Fehler beim Verschlüsseln von Daten:", error);
    throw new Error("Fehler beim Verschlüsseln von Daten.");
  }
};

// Platzhalter für die Verschlüsselung, falls client-seitig benötigt (z.B. vor dem Senden an das Backend)
// export const encryptData = (data, key) => { ... }; 