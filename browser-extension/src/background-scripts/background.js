// This is the background script for the browser extension.
// It runs in the background and handles events, state management, and communication.

console.log('Background script started.');

// Note: ES6 imports werden später durch chrome.runtime.sendMessage ersetzt
// import { getPasswordsExtension } from '../../api/api';
// import { decryptData, deriveKeyFromPassword } from '../../utils/crypto';
// import CryptoJS from 'crypto-js';

// Crypto-Funktionen direkt implementiert (ohne externe Dependencies)
function base64ToBytes(base64) {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

function bytesToBase64(bytes) {
  const binaryString = String.fromCharCode(...bytes);
  return btoa(binaryString);
}

// Web Crypto API basierte Entschlüsselung
async function decryptData(encryptedDataBase64, ivBase64, tagBase64, keyBase64) {
  try {
    const encryptedData = base64ToBytes(encryptedDataBase64);
    const iv = base64ToBytes(ivBase64);
    const tag = base64ToBytes(tagBase64);
    const key = base64ToBytes(keyBase64);
    
    // Kombiniere encrypted data und tag für AES-GCM
    const encryptedWithTag = new Uint8Array(encryptedData.length + tag.length);
    encryptedWithTag.set(encryptedData);
    encryptedWithTag.set(tag, encryptedData.length);
    
    // Importiere den Schlüssel
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      key,
      { name: 'AES-GCM' },
      false,
      ['decrypt']
    );
    
    // Entschlüssele
    const decrypted = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv
      },
      cryptoKey,
      encryptedWithTag
    );
    
    return new TextDecoder().decode(decrypted);
  } catch (error) {
    console.error('Entschlüsselungs-Fehler:', error);
    throw error;
  }
}

// API-Funktionen direkt implementiert
async function getPasswordsExtension() {
  const authData = await chrome.storage.local.get(['token']);
  if (!authData.token) {
    throw new Error('Nicht authentifiziert');
  }
  
  const response = await fetch('http://localhost:8080/api/passwords', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${authData.token}`,
      'Content-Type': 'application/json'
    }
  });
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  
  return await response.json();
}

// Example: Listen for messages from other parts of the extension (popup, content scripts)
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Received message:', request);

  // Example: Handle a specific message type
  if (request.action === 'getAuthStatus') {
    // In a real app, check if user is logged in (e.g., by checking stored token)
    const isLoggedIn = false; // Placeholder
    sendResponse({ isLoggedIn: isLoggedIn });
  }

  // Return true to indicate that you want to send a response asynchronously
  return true;
});

// Example: Listen for browser action (popup button) clicks (Manifest v2)
// For Manifest v3, the action is defined in manifest.json
/*
chrome.browserAction.onClicked.addListener((tab) => {
  console.log('Browser action clicked.', tab);
  // Logic to show popup or perform action
});
*/

// More logic for state management, API calls, etc. will be added here later.

// Background Service für die TrustMe Browser-Extension

// Event-Listener für Auth-Events
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Received message in background:', message);
  if (message.action === 'AUTH_REQUIRED') {
    handleAuthRequired();
  } else if (message.action === 'REQUEST_PASSWORDS_FOR_URL') {
     // Handle request from content script or popup for passwords related to a URL
     // Note: This might be redundant if handleTabUpdate already sends relevant passwords
     // but can be useful for specific requests.
     // For now, we rely on handleTabUpdate.
     sendResponse({ success: false, message: "Not implemented via direct request yet." });
     return true; // Indicates we will send a response asynchronously
  }

  // Return false to indicate that you will not send a response
  // If you want to send a response asynchronously, return true and call sendResponse later.
  return false; 
});

// Event-Listener für Installation/Update
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    // Bei Erstinstallation
    initializeExtension();
  } else if (details.reason === 'update') {
    // Bei Update
    handleExtensionUpdate(details.previousVersion);
  }
});

// Event-Listener für Tab-Updates
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // We are interested when the page is fully loaded and the URL is available
  if (changeInfo.status === 'complete' && tab.url) {
    handleTabUpdate(tab);
  }
});

// Event-Listener für Extension-Icon-Klicks
chrome.action.onClicked.addListener((tab) => {
  // This will open the popup - handled by manifest.json default_popup
  console.log('Extension icon clicked for tab:', tab.url);
});

// --- Autofill related logic ---
async function handleTabUpdate(tab) {
  console.log('Tab updated:', tab.url);
  try {
    // Prüfe Auth-Status
    // Use 'token' key for consistency with Go backend
    const authData = await chrome.storage.local.get(['token', 'encryption_key']);
    if (!authData.token || !authData.encryption_key) {
      console.log('Not authenticated. Cannot fetch passwords for autofill.');
      // If not authenticated, do not proceed with fetching passwords
      return;
    }

    // If authenticated, fetch and process passwords
    const encryptionKeyBase64 = authData.encryption_key;
    
    // Fetch all passwords from the backend
    const response = await getPasswordsExtension();
    const encryptedPasswords = response.data;

    // Decrypt and filter relevant passwords for the current URL
    const relevantPasswords = [];
    for (const pw of encryptedPasswords) {
      try {
        // Ensure data formats match the expected Base64 strings
        const decryptedUsername = await decryptData(pw.encrypted_username, pw.username_iv, pw.username_tag, encryptionKeyBase64);
        const decryptedPassword = await decryptData(pw.encrypted_password, pw.password_iv, pw.password_tag, encryptionKeyBase64);
        // Handle potentially null notes field from backend
        const decryptedNotes = pw.encrypted_notes ? await decryptData(pw.encrypted_notes, pw.notes_iv, pw.notes_tag, encryptionKeyBase64) : '';
        
        const decryptedPw = {
          ...pw, // Keep original id and website_url
          username: decryptedUsername,
          password: decryptedPassword,
          notes: decryptedNotes
        };
        
        // Basic URL matching: Check if stored website_url hostname matches current tab hostname
        try {
          const storedUrl = new URL(pw.website_url);
          const currentTabUrl = new URL(tab.url);
          if (storedUrl.hostname === currentTabUrl.hostname) {
            relevantPasswords.push(decryptedPw);
          }
        } catch (urlError) {
          console.error("Error parsing URL for matching:", urlError);
          // Skip this password if URL is invalid
        }
      } catch (decryptError) {
        console.error("Error decrypting password in background:", decryptError);
        // Skip this password if decryption fails
      }
    }

    console.log('Relevant passwords for URL ', tab.url, ':', relevantPasswords);

    // Send relevant passwords to the content script of the active tab
    // The content script will then decide whether to show a prompt or autofill
    if (relevantPasswords.length > 0) {
      chrome.tabs.sendMessage(tab.id, {
        action: "showAutofillPrompt",
        passwords: relevantPasswords,
        url: tab.url
      }).catch(error => {
         // This catches errors if the content script is not listening
         console.warn('Could not send message to content script:', error);
      });
    }

    // Keep the action icon enabled/disabled based on whether it's a password relevant URL
    if (isPasswordRelevantUrl(tab.url)) {
      chrome.action.enable(tab.id);
    } else {
      chrome.action.disable(tab.id);
    }

  } catch (error) {
    console.error('Error in handleTabUpdate:', error);
    // Handle errors, e.g., show a notification to the user
    // setError('Fehler beim Laden der Passwörter für Autofill.'); // Cannot directly set UI error from background script
  }
}

// Hilfsfunktion: Prüfe ob URL für Passwort-Funktionalität relevant ist
function isPasswordRelevantUrl(url) {
  if (!url) return false;
  
  try {
    const urlObj = new URL(url);
    const protocol = urlObj.protocol;
    
    // Nur HTTP/HTTPS URLs sind für Passwörter relevant
    if (protocol !== 'http:' && protocol !== 'https:') {
      return false;
    }
    
    // Ignoriere bestimmte URLs
    const hostname = urlObj.hostname;
    const ignoredHosts = ['chrome-extension', 'moz-extension', 'edge-extension'];
    
    return !ignoredHosts.some(ignored => hostname.includes(ignored));
  } catch (error) {
    console.error('Error parsing URL:', error);
    return false;
  }
}

// Hilfsfunktionen
async function handleAuthRequired() {
  try {
    // Lösche gespeicherte Auth-Daten
    await chrome.storage.local.remove(['token', 'encryption_key']); // Use 'token' key
    
    // Öffne das Popup für die Neuauthentifizierung
    // chrome.action.setPopup({ popup: 'popup.html' }); // Setting popup is often handled by manifest
    console.log("Authentication required. User needs to log in via popup.");
  } catch (error) {
    console.error('Fehler beim Auth-Reset:', error);
  }
}

async function initializeExtension() {
  try {
    // Setze initiale Einstellungen
    await chrome.storage.local.set({
      settings: {
        autoFill: true, // Default to true for autofill
        showNotifications: true,
        theme: 'light'
      }
    });

    // Öffne die Willkommensseite
    // chrome.tabs.create({
    //   url: chrome.runtime.getURL('welcome.html')
    // });
    console.log("Extension initialized.");

  } catch (error) {
    console.error('Fehler bei der Initialisierung:', error);
  }
}

async function handleExtensionUpdate(previousVersion) {
  try {
    console.log('Extension updated from', previousVersion);
    // Prüfe auf Breaking Changes
    // if (previousVersion && previousVersion < '1.1.0') {
    //   // Migration für ältere Versionen
    //   await migrateFromOldVersion();
    // }

    // Aktualisiere Einstellungen (add new settings with defaults if they don't exist)
    const currentSettings = await chrome.storage.local.get(['settings']);
    const updatedSettings = {
       autoFill: currentSettings.settings?.autoFill ?? true, // Ensure existing setting is kept or set to default
       showNotifications: currentSettings.settings?.showNotifications ?? true,
       theme: currentSettings.settings?.theme ?? 'light',
       // Add any new settings here with their defaults
       // 예를 들어: autoFillPrompt: currentSettings.settings?.autoFillPrompt ?? 'prompt', // 'prompt' or 'autofill'
    };
    await chrome.storage.local.set({ settings: updatedSettings });
    console.log("Settings updated after extension update.", updatedSettings);

  } catch (error) {
    console.error('Fehler beim Update:', error);
  }
}

// Hilfsfunktionen für URL-Prüfung
function isPasswordRelevantUrl(url) {
  try {
    const urlObj = new URL(url);
    // Prüfe, ob es sich um eine HTTP/HTTPS-URL handelt und nicht um eine Extension-interne Seite
    return (urlObj.protocol === 'http:' || urlObj.protocol === 'https:') && !urlObj.hostname.endsWith('.chromiumapp.org');
  } catch {
    return false;
  }
}

// No longer needed as settings update handles defaults
// async function migrateFromOldVersion() { /* ... */ }
// async function updateSettings() { /* ... */ }

// Exportiere Funktionen für Tests
// if (typeof module !== 'undefined' && module.exports) {
//   module.exports = {
//     handleAuthRequired,
//     initializeExtension,
//     handleExtensionUpdate,
//     handleTabUpdate,
//     isPasswordRelevantUrl
//   };
// } 