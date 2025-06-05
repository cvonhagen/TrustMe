// Content Script für TrustMe Password Manager

// Event-Listener für Nachrichten vom Popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'autofill') {
    handleAutofill(message.username, message.password);
  }
});

// Hauptfunktion für das Autofill
function handleAutofill(username, password) {
  try {
    // Finde alle relevanten Eingabefelder
    const inputFields = findInputFields();
    
    // Fülle die Felder aus
    fillInputFields(inputFields, username, password);
    
    // Optional: Formular automatisch absenden
    // submitForm(inputFields.form);
  } catch (error) {
    console.error('Fehler beim Autofill:', error);
  }
}

// Hilfsfunktion zum Finden der Eingabefelder
function findInputFields() {
  const fields = {
    username: null,
    password: null,
    form: null
  };

  // Suche nach dem Formular
  const forms = document.getElementsByTagName('form');
  if (forms.length > 0) {
    fields.form = forms[0];
  }

  // Suche nach Benutzernamen-Feldern
  const usernameSelectors = [
    'input[type="text"]',
    'input[type="email"]',
    'input[name*="user"]',
    'input[name*="email"]',
    'input[id*="user"]',
    'input[id*="email"]',
    'input[placeholder*="user"]',
    'input[placeholder*="email"]'
  ];

  // Suche nach Passwort-Feldern
  const passwordSelectors = [
    'input[type="password"]',
    'input[name*="pass"]',
    'input[id*="pass"]'
  ];

  // Finde das erste passende Benutzernamen-Feld
  for (const selector of usernameSelectors) {
    const field = document.querySelector(selector);
    if (field && isVisible(field)) {
      fields.username = field;
      break;
    }
  }

  // Finde das erste passende Passwort-Feld
  for (const selector of passwordSelectors) {
    const field = document.querySelector(selector);
    if (field && isVisible(field)) {
      fields.password = field;
      break;
    }
  }

  return fields;
}

// Hilfsfunktion zum Ausfüllen der Felder
function fillInputFields(fields, username, password) {
  if (fields.username) {
    // Fülle Benutzernamen-Feld
    fields.username.value = username;
    // Trigger Input-Event
    fields.username.dispatchEvent(new Event('input', { bubbles: true }));
    fields.username.dispatchEvent(new Event('change', { bubbles: true }));
  }

  if (fields.password) {
    // Fülle Passwort-Feld
    fields.password.value = password;
    // Trigger Input-Event
    fields.password.dispatchEvent(new Event('input', { bubbles: true }));
    fields.password.dispatchEvent(new Event('change', { bubbles: true }));
  }
}

// Hilfsfunktion zum Prüfen der Sichtbarkeit
function isVisible(element) {
  const style = window.getComputedStyle(element);
  return style.display !== 'none' && 
         style.visibility !== 'hidden' && 
         style.opacity !== '0' &&
         element.offsetWidth > 0 &&
         element.offsetHeight > 0;
}

// Hilfsfunktion zum Absenden des Formulars
function submitForm(form) {
  if (form) {
    // Optional: Warte kurz, bevor das Formular abgesendet wird
    setTimeout(() => {
      form.submit();
    }, 500);
  }
}

// Beobachte DOM-Änderungen für dynamische Formulare
const observer = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    if (mutation.addedNodes.length) {
      // Prüfe, ob neue Formulare hinzugefügt wurden
      const forms = document.getElementsByTagName('form');
      if (forms.length > 0) {
        // Optional: Automatisches Ausfüllen für neue Formulare
        // handleAutofill(username, password);
      }
    }
  }
});

// Starte Beobachtung
observer.observe(document.body, {
  childList: true,
  subtree: true
}); 