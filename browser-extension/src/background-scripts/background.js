// This is the background script for the browser extension.
// It runs in the background and handles events, state management, and communication.

console.log('Background script started.');

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
  if (message.action === 'AUTH_REQUIRED') {
    handleAuthRequired();
  }
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
  if (changeInfo.status === 'complete' && tab.url) {
    handleTabUpdate(tab);
  }
});

// Hilfsfunktionen
async function handleAuthRequired() {
  try {
    // Lösche gespeicherte Auth-Daten
    await chrome.storage.local.remove(['access_token', 'encryption_key']);
    
    // Öffne das Popup für die Neuauthentifizierung
    chrome.action.setPopup({ popup: 'popup.html' });
  } catch (error) {
    console.error('Fehler beim Auth-Reset:', error);
  }
}

async function initializeExtension() {
  try {
    // Setze initiale Einstellungen
    await chrome.storage.local.set({
      settings: {
        autoFill: true,
        showNotifications: true,
        theme: 'light'
      }
    });

    // Öffne die Willkommensseite
    chrome.tabs.create({
      url: chrome.runtime.getURL('welcome.html')
    });
  } catch (error) {
    console.error('Fehler bei der Initialisierung:', error);
  }
}

async function handleExtensionUpdate(previousVersion) {
  try {
    // Prüfe auf Breaking Changes
    if (previousVersion && previousVersion < '1.1.0') {
      // Migration für ältere Versionen
      await migrateFromOldVersion();
    }

    // Aktualisiere Einstellungen
    await updateSettings();
  } catch (error) {
    console.error('Fehler beim Update:', error);
  }
}

async function handleTabUpdate(tab) {
  try {
    // Prüfe Auth-Status
    const authData = await chrome.storage.local.get(['access_token']);
    if (!authData.access_token) {
      // Wenn nicht authentifiziert, zeige Login-Popup
      chrome.action.setPopup({ popup: 'popup.html' });
      return;
    }

    // Prüfe, ob die URL für Passwort-Management relevant ist
    if (isPasswordRelevantUrl(tab.url)) {
      // Aktiviere das Extension-Icon
      chrome.action.enable(tab.id);
    } else {
      // Deaktiviere das Extension-Icon
      chrome.action.disable(tab.id);
    }
  } catch (error) {
    console.error('Fehler beim Tab-Update:', error);
  }
}

// Hilfsfunktionen für URL-Prüfung
function isPasswordRelevantUrl(url) {
  try {
    const urlObj = new URL(url);
    // Prüfe, ob es sich um eine HTTP/HTTPS-URL handelt
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch {
    return false;
  }
}

async function migrateFromOldVersion() {
  try {
    // Hole alte Einstellungen
    const oldData = await chrome.storage.local.get(['settings']);
    
    // Migriere zu neuem Format
    if (oldData.settings) {
      await chrome.storage.local.set({
        settings: {
          ...oldData.settings,
          // Neue Einstellungen mit Standardwerten
          autoFill: oldData.settings.autoFill ?? true,
          showNotifications: oldData.settings.showNotifications ?? true,
          theme: oldData.settings.theme ?? 'light'
        }
      });
    }
  } catch (error) {
    console.error('Fehler bei der Migration:', error);
  }
}

async function updateSettings() {
  try {
    // Hole aktuelle Einstellungen
    const currentSettings = await chrome.storage.local.get(['settings']);
    
    // Aktualisiere mit neuen Standardwerten
    await chrome.storage.local.set({
      settings: {
        ...currentSettings.settings,
        // Neue Einstellungen
        lastUpdate: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Fehler beim Aktualisieren der Einstellungen:', error);
  }
}

// Exportiere Funktionen für Tests
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    handleAuthRequired,
    initializeExtension,
    handleExtensionUpdate,
    handleTabUpdate,
    isPasswordRelevantUrl
  };
} 