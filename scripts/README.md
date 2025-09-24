# TrustMe Test-Daten-Generator

Dieses Script erzeugt Testdaten für TrustMe mit der neuen **Argon2id-Implementation**.

## 🔧 Setup

1. **Dependencies installieren:**
   ```bash
   npm install
   ```

2. **Backend starten:**
   ```bash
   cd ../backend
   go run main.go
   ```

3. **Script ausführen:**
   ```bash
   npm run generate
   ```

## ⚙️ Konfiguration

Das Script erzeugt standardmäßig:
- **5 Testbenutzer** (`testuser_TIMESTAMP_1` bis `testuser_TIMESTAMP_5`)
- **10 Passwort-Einträge** pro Benutzer
- **Total: 50 verschlüsselte Einträge**

Anpassbar in `generate_data.js`:
```javascript
const NUM_USERS = 5;                    // Anzahl Testbenutzer
const NUM_PASSWORDS_PER_USER = 10;      // Passwörter pro User
const BASE_TEST_PASSWORD = 'TestPassword123!'; // Master-Passwort
```

## 🔐 Argon2id-Features

- **OWASP-konforme Parameter**: time=3, memory=64MB, threads=4
- **Automatischer Fallback**: Auf PBKDF2 bei Fehlern
- **Intelligente Migration**: Neue User nutzen Argon2id
- **Legacy-Support**: Kompatibel mit bestehenden Daten

## 📊 Output

```
--- Processing User 1/5: testuser_1695123456789_1 ---
Registering user...
User registered successfully.
Setze E-Mail als verifiziert für Testdaten...
E-Mail erfolgreich als verifiziert markiert.
Logging in user...
User logged in successfully. JWT and salt received.
Verwende Argon2id für Key-Derivation...
Encryption key derived successfully.
Generating and encrypting 10 password entries...
All 10 password entries encrypted.
Sending password entries to backend...
All password entries sent successfully.
```

## 🛠️ Troubleshooting

**Fehler: "argon2 nicht installiert"**
```bash
npm install argon2
```

**Backend-Connection Error:**
- Backend auf Port 8080 gestartet?
- Test-Endpoint verfügbar: `POST /api/v1/test/verify-email/:username`

**Memory-Error bei Argon2id:**
- Script reduziert automatisch auf PBKDF2
- Parameter in `argon2idConfig` anpassen

## 💾 Datenbank

Die generierten Daten werden in der konfigurierten PostgreSQL/Neon-DB gespeichert:
- **users**: Testbenutzer mit Argon2id-Hashes
- **passwords**: AES-256-GCM verschlüsselte Einträge