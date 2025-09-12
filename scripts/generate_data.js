const axios = require('axios');
const crypto = require('crypto'); // Node.js built-in crypto module

const API_BASE_URL = 'http://localhost:8080/api/v1'; // Backend-API für Testdaten-Generierung
const BASE_TEST_PASSWORD = 'TestPassword123!'; // Base password for all test users

const NUM_USERS = 10; // Anzahl der zu erstellenden Testbenutzer (für 100.000 Datensätze)
const NUM_PASSWORDS_PER_USER = 10000; // Anzahl der Passworteinträge pro Benutzer (für 100.000 Datensätze)

// PBKDF2 parameters - must match backend/frontend (from backend/security/security.go)
const pbkdf2Iterations = 250000;
const pbkdf2KeyLen = 32; // 32 bytes for AES-256
// Salt length is determined by the backend (16 bytes)
const pbkdf2HashAlgorithm = 'sha256';

// Function to derive key using PBKDF2 (Node.js crypto)
const deriveKeyFromPassword = async (password, saltBuffer) => {
    return new Promise((resolve, reject) => {
        crypto.pbkdf2(
            password,
            saltBuffer,
            pbkdf2Iterations,
            pbkdf2KeyLen,
            pbkdf2HashAlgorithm,
            (err, derivedKey) => {
                if (err) {
                    return reject(err);
                }
                resolve(derivedKey); // derivedKey is a Buffer
            }
        );
    });
};

// Function to encrypt data using AES-256 GCM (Node.js crypto)
// This should replicate the encryption logic in frontend/src/utils/crypto.js
const encryptData = (data, keyBuffer) => {
    try {
        const iv = crypto.randomBytes(12); // 96 bits IV for GCM
        const cipher = crypto.createCipheriv('aes-256-gcm', keyBuffer, iv);

        let encrypted = cipher.update(data, 'utf8', 'base64');
        encrypted += cipher.final('base64');

        const tag = cipher.getAuthTag();

        // Convert to Base64 (Node.js toString('base64') produces standard Base64 with padding)
        return {
            encryptedText: encrypted,
            iv: iv.toString('base64'),
            tag: tag.toString('base64')
        };
    } catch (error) {
        console.error("Error encrypting data:", error);
        throw new Error("Failed to encrypt data.");
    }
};

// Main function to generate data
const generateData = async () => {
    console.log(`Starting data generation: ${NUM_USERS} users, ${NUM_PASSWORDS_PER_USER} passwords per user (Total: ${NUM_USERS * NUM_PASSWORDS_PER_USER} entries)`);

    for (let i = 1; i <= NUM_USERS; i++) {
        const username = `testuser_${i}`;
        const password = BASE_TEST_PASSWORD;

        try {
            console.log(`\n--- Processing User ${i}/${NUM_USERS}: ${username} ---`);

            // 1. Register User
            console.log('Registering user...');
            await axios.post(`${API_BASE_URL}/auth/register`, {
                username: username,
                email: `${username}@example.com`,
                password: password,
            });
            console.log('User registered successfully.');

            // 2. Login User to get JWT and Salt
            console.log('Logging in user...');
            const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
                username: username,
                password: password,
            });
            const { token, salt: userSaltBase64 } = loginResponse.data;
            console.log('User logged in successfully. JWT and salt received.');

            // Decode the base64 salt to Buffer
            const userSaltBuffer = Buffer.from(userSaltBase64, 'base64');

            // 3. Derive Encryption Key
            console.log('Deriving encryption key...');
            const encryptionKey = await deriveKeyFromPassword(password, userSaltBuffer);
            console.log('Encryption key derived.');

            // 4. Generate and Encrypt Password Entries for this user
            console.log(`Generating and encrypting ${NUM_PASSWORDS_PER_USER} password entries for ${username}...`);
            const passwordEntries = [];
            for (let j = 1; j <= NUM_PASSWORDS_PER_USER; j++) {
                const website_url = `https://${username}-site-${j}.com`;
                const plain_username = `user_${username}_${j}`;
                const plain_password = `pass_${username}_${j}!`
                const plain_notes = `Notes for ${username}, entry ${j}`;

                const encryptedUsername = encryptData(plain_username, encryptionKey);
                const encryptedPassword = encryptData(plain_password, encryptionKey);
                const encryptedNotes = encryptData(plain_notes, encryptionKey);

                passwordEntries.push({
                    website_url: website_url,
                    encrypted_username: encryptedUsername.encryptedText,
                    username_iv: encryptedUsername.iv,
                    username_tag: encryptedUsername.tag,
                    encrypted_password: encryptedPassword.encryptedText,
                    password_iv: encryptedPassword.iv,
                    password_tag: encryptedPassword.tag,
                    encrypted_notes: encryptedNotes.encryptedText,
                    notes_iv: encryptedNotes.iv,
                    notes_tag: encryptedNotes.tag,
                });
            }
            console.log(`All ${NUM_PASSWORDS_PER_USER} password entries encrypted for ${username}.`);

            // 5. Send Password Entries to Backend for this user
            console.log('Sending password entries to backend...');
            const headers = {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            };

            const BATCH_SIZE = 500; // Batch-Größe für Passwörter
            for (let k = 0; k < passwordEntries.length; k += BATCH_SIZE) {
                const batch = passwordEntries.slice(k, k + BATCH_SIZE);
                await axios.post(`${API_BASE_URL}/passwords/batch`, { passwords: batch }, { headers });
                console.log(`Sent batch ${Math.floor(k / BATCH_SIZE) + 1} for ${username}.`);
            }
            console.log(`All password entries for ${username} sent successfully.`);

        } catch (error) {
            console.error(`Error processing user ${username}:`, error.message || error);
            if (error.response) {
                console.error('Response data:', error.response.data);
                console.error('Response status:', error.response.status);
            }
            // Continue with the next user even if one fails
        }
    }
    console.log('\n--- Data generation process finished ---');
};

generateData(); 