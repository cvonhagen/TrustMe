// TrustMe Browser Extension Popup Script

// DOM Elements
const elements = {
    loading: document.getElementById('loading'),
    loginForm: document.getElementById('loginForm'),
    dashboard: document.getElementById('dashboard'),
    error: document.getElementById('error'),
    success: document.getElementById('success'),
    username: document.getElementById('username'),
    password: document.getElementById('password'),
    loginBtn: document.getElementById('loginBtn'),
    openWebAppBtn: document.getElementById('openWebAppBtn'),
    userName: document.getElementById('userName'),
    passwordList: document.getElementById('passwordList'),
    noPasswords: document.getElementById('noPasswords'),
    logoutBtn: document.getElementById('logoutBtn'),
    addPasswordLink: document.getElementById('addPasswordLink')
};

// Configuration
const CONFIG = {
    API_BASE_URL: 'http://localhost:3030/api/v1',
    WEB_APP_URL: 'http://localhost:5173'
};

// State
let currentUser = null;
let currentPasswords = [];
let currentTab = null;

// Initialize popup
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Get current tab
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        currentTab = tabs[0];

        // Check authentication status
        await checkAuthStatus();
        
        // Setup event listeners
        setupEventListeners();
    } catch (error) {
        console.error('Initialization error:', error);
        showError('Fehler beim Laden der Extension');
    }
});

// Setup event listeners
function setupEventListeners() {
    elements.loginBtn.addEventListener('click', handleLogin);
    elements.openWebAppBtn.addEventListener('click', openWebApp);
    elements.logoutBtn.addEventListener('click', handleLogout);
    elements.addPasswordLink.addEventListener('click', openWebApp);
    
    // Enter key support for login
    elements.password.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleLogin();
        }
    });
}

// Check authentication status
async function checkAuthStatus() {
    try {
        const authData = await chrome.storage.local.get(['token', 'username', 'encryption_key']);
        
        if (authData.token && authData.username && authData.encryption_key) {
            currentUser = authData.username;
            await loadDashboard();
        } else {
            showLoginForm();
        }
    } catch (error) {
        console.error('Auth check error:', error);
        showLoginForm();
    }
}

// Show login form
function showLoginForm() {
    hideLoading();
    elements.loginForm.classList.add('active');
    elements.dashboard.classList.remove('active');
    elements.username.focus();
}

// Show dashboard
function showDashboard() {
    hideLoading();
    elements.loginForm.classList.remove('active');
    elements.dashboard.classList.add('active');
    elements.userName.textContent = currentUser;
}

// Show/hide loading
function showLoading() {
    elements.loading.style.display = 'block';
    elements.loginForm.classList.remove('active');
    elements.dashboard.classList.remove('active');
}

function hideLoading() {
    elements.loading.style.display = 'none';
}

// Handle login
async function handleLogin() {
    const username = elements.username.value.trim();
    const masterPassword = elements.password.value;

    if (!username || !masterPassword) {
        showError('Bitte alle Felder ausfüllen');
        return;
    }

    showLoading();
    clearMessages();

    try {
        // Login API call
        const response = await fetch(`${CONFIG.API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: username,
                master_password: masterPassword
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Login fehlgeschlagen');
        }

        // Handle 2FA if enabled
        if (data.two_fa_enabled) {
            showError('2FA wird in der Extension noch nicht unterstützt. Bitte verwenden Sie die Web-App.');
            showLoginForm();
            return;
        }

        // Store auth data
        await chrome.storage.local.set({
            token: data.token,
            username: username,
            encryption_key: data.salt, // Store salt for key derivation
            salt: data.salt
        });

        currentUser = username;
        await loadDashboard();
        showSuccess('Erfolgreich angemeldet!');

    } catch (error) {
        console.error('Login error:', error);
        showError(error.message || 'Anmeldung fehlgeschlagen');
        showLoginForm();
    }
}

// Load dashboard
async function loadDashboard() {
    try {
        showDashboard();
        await loadPasswords();
    } catch (error) {
        console.error('Dashboard load error:', error);
        showError('Fehler beim Laden des Dashboards');
    }
}

// Load passwords
async function loadPasswords() {
    try {
        const authData = await chrome.storage.local.get(['token']);
        
        if (!authData.token) {
            throw new Error('Nicht authentifiziert');
        }

        const response = await fetch(`${CONFIG.API_BASE_URL}/passwords`, {
            headers: {
                'Authorization': `Bearer ${authData.token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            if (response.status === 401) {
                await handleLogout();
                return;
            }
            throw new Error('Fehler beim Laden der Passwörter');
        }

        const passwords = await response.json();
        currentPasswords = passwords;
        
        // Filter passwords for current domain
        const relevantPasswords = filterPasswordsForCurrentTab(passwords);
        displayPasswords(relevantPasswords);

    } catch (error) {
        console.error('Load passwords error:', error);
        showError(error.message || 'Fehler beim Laden der Passwörter');
    }
}

// Filter passwords for current tab
function filterPasswordsForCurrentTab(passwords) {
    if (!currentTab || !currentTab.url) {
        return [];
    }

    try {
        const currentUrl = new URL(currentTab.url);
        const currentDomain = currentUrl.hostname;

        return passwords.filter(password => {
            try {
                const passwordUrl = new URL(password.website_url);
                return passwordUrl.hostname === currentDomain;
            } catch {
                return false;
            }
        });
    } catch {
        return [];
    }
}

// Display passwords
function displayPasswords(passwords) {
    elements.passwordList.innerHTML = '';
    
    if (passwords.length === 0) {
        elements.noPasswords.style.display = 'block';
        return;
    }

    elements.noPasswords.style.display = 'none';

    passwords.forEach(password => {
        const passwordItem = createPasswordItem(password);
        elements.passwordList.appendChild(passwordItem);
    });
}

// Create password item element
function createPasswordItem(password) {
    const item = document.createElement('div');
    item.className = 'password-item';
    
    // Note: In a real implementation, you would decrypt the password here
    // For now, we'll show encrypted data or placeholder
    const websiteUrl = password.website_url || 'Unbekannte Website';
    const username = password.encrypted_username ? '[Verschlüsselt]' : 'Kein Benutzername';

    item.innerHTML = `
        <div class="password-info">
            <div class="password-website">${getDomainFromUrl(websiteUrl)}</div>
            <div class="password-username">${username}</div>
        </div>
        <div class="password-actions">
            <button class="btn-small btn-fill" data-id="${password.id}">Ausfüllen</button>
            <button class="btn-small btn-copy" data-id="${password.id}">Kopieren</button>
        </div>
    `;

    // Add event listeners
    const fillBtn = item.querySelector('.btn-fill');
    const copyBtn = item.querySelector('.btn-copy');

    fillBtn.addEventListener('click', () => fillPassword(password));
    copyBtn.addEventListener('click', () => copyPassword(password));

    return item;
}

// Get domain from URL
function getDomainFromUrl(url) {
    try {
        return new URL(url).hostname;
    } catch {
        return url;
    }
}

// Fill password in current tab
async function fillPassword(password) {
    try {
        // Note: In a real implementation, you would decrypt the password here
        // For now, we'll send a message to the content script
        await chrome.tabs.sendMessage(currentTab.id, {
            action: 'autofill',
            username: '[Verschlüsselt - Entschlüsselung erforderlich]',
            password: '[Verschlüsselt - Entschlüsselung erforderlich]'
        });

        showSuccess('Autofill-Anfrage gesendet');
        window.close();
    } catch (error) {
        console.error('Fill password error:', error);
        showError('Fehler beim Ausfüllen des Passworts');
    }
}

// Copy password to clipboard
async function copyPassword(password) {
    try {
        // Note: In a real implementation, you would decrypt the password here
        await navigator.clipboard.writeText('[Verschlüsselt - Entschlüsselung erforderlich]');
        showSuccess('Passwort in Zwischenablage kopiert');
    } catch (error) {
        console.error('Copy password error:', error);
        showError('Fehler beim Kopieren des Passworts');
    }
}

// Handle logout
async function handleLogout() {
    try {
        // Clear stored data
        await chrome.storage.local.clear();
        
        // Reset state
        currentUser = null;
        currentPasswords = [];
        
        // Show login form
        showLoginForm();
        clearMessages();
        
        // Clear form fields
        elements.username.value = '';
        elements.password.value = '';
        
    } catch (error) {
        console.error('Logout error:', error);
        showError('Fehler beim Abmelden');
    }
}

// Open web app
function openWebApp() {
    chrome.tabs.create({ url: CONFIG.WEB_APP_URL });
    window.close();
}

// Show error message
function showError(message) {
    elements.error.textContent = message;
    elements.error.classList.add('show');
    elements.success.classList.remove('show');
}

// Show success message
function showSuccess(message) {
    elements.success.textContent = message;
    elements.success.classList.add('show');
    elements.error.classList.remove('show');
}

// Clear messages
function clearMessages() {
    elements.error.classList.remove('show');
    elements.success.classList.remove('show');
}