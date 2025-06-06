const axios = require('axios');
const crypto = require('crypto'); // Node.js built-in crypto module

const API_BASE_URL = 'http://localhost:3030/api/v1'; // Your backend URL
const BASE_TEST_PASSWORD = 'TestPassword123!'; // Base password for all test users

const NUM_USERS = 5; // Number of test users to create
const NUM_PASSWORDS_PER_USER = 20; // Number of password entries per user

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

        // Convert to Base64 and ensure compatibility with Go backend RawStdEncoding
        const encryptedTextBase64 = encrypted.toString('base64');
        const ivBase64 = iv.toString('base64');
        const tagBase64 = tag.toString('base64');

        // Remove padding and any non-Base64 characters (optional, but good practice)
        const cleanBase64 = (str) => str.replace(/[^A-Za-z0-9+/]/g, '').replace(/=+\$/, '');

        return {
            encryptedText: cleanBase64(encryptedTextBase64),
            iv: cleanBase64(ivBase64),
            tag: cleanBase64(tagBase64)
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

            for (const entry of passwordEntries) {
                // Sending entries one by one. Can be optimized for bulk insertion if backend supports.
                await axios.post(`${API_BASE_URL}/passwords`, entry, { headers });
                // console.log(`Password entry for ${entry.website_url} sent.`); // Uncomment for detailed progress
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