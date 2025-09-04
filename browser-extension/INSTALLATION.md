# TrustMe Browser Extension - Installation

## 🚀 Schnellstart

### 1. Extension bauen
```bash
cd browser-extension
npm run build
```

### 2. In Chrome installieren
1. Öffne Chrome und gehe zu `chrome://extensions/`
2. Aktiviere den **"Entwicklermodus"** (Toggle oben rechts)
3. Klicke auf **"Entpackte Erweiterung laden"**
4. Wähle den `browser-extension/dist/` Ordner aus
5. Die TrustMe Extension erscheint in der Toolbar

### 3. Extension verwenden
1. **Backend starten**: Stelle sicher, dass das TrustMe Backend läuft (`http://localhost:3030`)
2. **Extension-Icon klicken**: Klicke auf das TrustMe-Icon in der Chrome-Toolbar
3. **Anmelden**: Verwende deine TrustMe-Anmeldedaten
4. **Passwörter verwenden**: Die Extension zeigt automatisch relevante Passwörter für die aktuelle Website

## 🔧 Entwicklung

### Voraussetzungen
- Node.js (v14 oder höher)
- Chrome Browser
- TrustMe Backend läuft auf `localhost:3030`

### Development Setup
```bash
# Dependencies installieren
npm install

# Extension im Watch-Modus bauen
npm run watch

# Extension in Chrome laden (siehe oben)
```

### Debugging
- **Background Script**: `chrome://extensions/` → Extension Details → "Service Worker" inspizieren
- **Popup**: Rechtsklick auf Extension-Icon → "Popup inspizieren"
- **Content Script**: Browser DevTools → Console

## 📱 Features

### ✅ Implementiert
- Sichere Authentifizierung mit TrustMe Backend
- Domain-basierte Passwort-Filterung
- Autofill-Funktionalität für Login-Formulare
- Passwort-Kopieren in Zwischenablage
- Responsive Popup-Interface
- Web-App Integration

### 🔄 In Entwicklung
- Vollständige End-to-End Verschlüsselung
- 2FA-Unterstützung in der Extension
- Erweiterte Formular-Erkennung
- Passwort-Generator

## 🛠️ Konfiguration

### Backend-URL ändern
Bearbeite folgende Dateien für andere Backend-URLs:

**popup.js:**
```javascript
const CONFIG = {
    API_BASE_URL: 'https://your-backend.com/api/v1',
    WEB_APP_URL: 'https://your-webapp.com'
};
```

**api/api.js:**
```javascript
const API_BASE_URL = 'https://your-backend.com/api/v1';
```

**manifest.json:**
```json
{
  "host_permissions": [
    "https://your-backend.com/*",
    "https://your-webapp.com/*"
  ]
}
```

### Icons anpassen
Die Extension verwendet das TrustMe Logo (`layer8.png`). Um eigene Icons zu verwenden:

1. Ersetze die Dateien in `public/`:
   - `icon16.png` (16x16 Pixel)
   - `icon48.png` (48x48 Pixel)
   - `icon128.png` (128x128 Pixel)

2. Baue die Extension neu:
   ```bash
   npm run build
   ```

## 🔒 Sicherheit

### Datenschutz
- Passwörter werden nur verschlüsselt übertragen
- Authentifizierungs-Token werden sicher in Chrome Storage gespeichert
- Keine Passwörter werden im Klartext gespeichert

### Berechtigungen
Die Extension benötigt minimale Berechtigungen:
- `storage` - Für Auth-Token
- `activeTab` - Für Autofill
- `scripting` - Für Content Scripts
- Host-Permissions nur für TrustMe-Domains

## 🐛 Troubleshooting

### Extension lädt nicht
- Überprüfe, ob alle Dateien im `dist/` Ordner vorhanden sind
- Stelle sicher, dass `manifest.json` gültig ist
- Prüfe die Chrome Extension Console auf Fehler

### Login funktioniert nicht
- Überprüfe, ob das Backend läuft (`http://localhost:3030`)
- Prüfe die Netzwerk-Registerkarte in den DevTools
- Stelle sicher, dass CORS korrekt konfiguriert ist

### Autofill funktioniert nicht
- Überprüfe, ob die Website Login-Formulare hat
- Prüfe die Browser-Konsole auf Content Script Fehler
- Stelle sicher, dass Passwörter für die Domain gespeichert sind

### Icons werden nicht angezeigt
- Überprüfe, ob alle Icon-Dateien in `public/` vorhanden sind
- Baue die Extension neu mit `npm run build`
- Lade die Extension in Chrome neu

## 📞 Support

Bei Problemen:
1. Überprüfe die Browser-Konsole auf Fehlermeldungen
2. Stelle sicher, dass Backend und Frontend laufen
3. Prüfe die Netzwerkverbindung
4. Erstelle ein Issue im Repository mit detaillierter Fehlerbeschreibung

## 🎯 Produktions-Deployment

### Chrome Web Store
1. **Extension verpacken**:
   ```bash
   npm run build:prod
   ```

2. **ZIP-Datei erstellen**:
   ```bash
   cd dist
   zip -r ../trustme-extension.zip .
   ```

3. **Chrome Developer Dashboard**:
   - Gehe zu https://chrome.google.com/webstore/devconsole/
   - Lade die ZIP-Datei hoch
   - Fülle Store-Listing aus
   - Reiche zur Überprüfung ein

### Enterprise Deployment
Für Unternehmens-Installationen kann die Extension über Chrome Enterprise Policies verteilt werden.