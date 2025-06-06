// This is the content script. It runs in the context of web pages.
// It can access the DOM and communicate with the background script and popup.

console.log('Content script loaded.');

// Listen for messages from the background script or popup
chrome.runtime.onMessage.addListener(
  (request, sender, sendResponse) => {
    console.log('Content script received message:', request);

    if (request.action === 'autofill') {
      try {
        const { username, password } = request;
        console.log('Attempting to autofill username:', username, 'password:', password ? '********' : '[empty]');
        fillLoginForm(username, password);
        sendResponse({ success: true, message: 'Autofill attempted.' });
      } catch (error) {
        console.error('Error during autofill:', error);
        sendResponse({ success: false, message: 'Error during autofill.', error: error.message });
      }
      // Return true to indicate asynchronous response
      return true;
    }

    // Handle other message actions here if needed

    // If no action is handled, no response is sent automatically.
  }
);

// Function to attempt to fill common login form fields
function fillLoginForm(username, password) {
  let usernameField = null;
  let passwordField = null;

  // Attempt to find username and password fields
  // Look for common input types and names/ids
  const inputs = document.querySelectorAll('input[type="text"], input[type="email"], input[type="number"], input[type="search"], input[type="tel"], input[type="url"], input:not([type])'); // Look for text-like inputs
  const passwordInputs = document.querySelectorAll('input[type="password"]');

  // Basic heuristic: find the first text-like input before a password input
  for (const passInput of passwordInputs) {
    passwordField = passInput;
    // Look for a preceding text-like input that could be the username field
    for (let i = inputs.length - 1; i >= 0; i--) {
      const currentInput = inputs[i];
      // Check if the text input is visually before or around the password input
      // This is a very basic check and might need refinement
       if (currentInput.compareDocumentPosition(passInput) & Node.DOCUMENT_POSITION_PRECEDING) {
         usernameField = currentInput;
         break; // Found a potential username field, stop searching for this password field
       }
    }
    if (usernameField && passwordField) break; // Found both, stop searching password fields
  }

   // If not found using the preceding heuristic, try other methods
   if (!usernameField || !passwordField) {
     console.log('Basic heuristic failed, trying name/id matching.');
      // Look for inputs with common names/ids
      usernameField = document.querySelector('input[name*="user" i], input[id*="user" i], input[name*="login" i], input[id*="login" i], input[name*="email" i], input[id*="email" i]');
      passwordField = document.querySelector('input[name*="pass" i], input[id*="pass" i]');
   }

  if (usernameField && username) {
    usernameField.value = username;
    // Dispatch input event to trigger frameworks like React or Angular
    usernameField.dispatchEvent(new Event('input', { bubbles: true }));
    usernameField.dispatchEvent(new Event('change', { bubbles: true }));
    console.log('Username field filled.');
  } else {
     console.log('Username field not found or username is empty.');
  }

  if (passwordField && password) {
    passwordField.value = password;
     // Dispatch input event
    passwordField.dispatchEvent(new Event('input', { bubbles: true }));
    passwordField.dispatchEvent(new Event('change', { bubbles: true }));
    console.log('Password field filled.');
  } else {
     console.log('Password field not found or password is empty.');
  }

  // Note: This is a basic implementation. More sophisticated methods might be needed
  // for complex forms, iframes, or single-page applications.
}

// Initial check or interaction can go here if needed when the script is injected
// For now, we primarily rely on messages from the background script. 