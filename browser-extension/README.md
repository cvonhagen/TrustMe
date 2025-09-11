# TrustMe Browser Extension

Eine sichere Browser-Extension für den TrustMe Password Manager mit End-to-End Verschlüsselung.

## Features

- 🔐 **Sichere Authentifizierung** - Verbindung mit dem TrustMe Backend
- 🚀 **Autofill-Funktionalität** - Automatisches Ausfüllen von Login-Formularen
- 🔒 **End-to-End Verschlüsselung** - Passwörter werden verschlüsselt übertragen und gespeichert
- 🎯 **Domain-basierte Filterung** - Zeigt nur relevante Passwörter für die aktuelle Website
- 📱 **Benutzerfreundliches Popup** - Einfache Bedienung über das Extension-Icon
- 🔄 **Synchronisation** - Arbeitet nahtlos mit der TrustMe Web-App zusammen

## Installation

### Entwicklungsumgebung

1. **Repository klonen**

   ```bash
   git clone <repository-url>
   cd TrustMe/browser-extension
   ```

2. **Dependencies installieren**

   ```bash
   npm install
   ```

3. **Extension in Chrome laden**
   - Öffne Chrome und gehe zu `chrome://extensions/`
   - Aktiviere den "Entwicklermodus" (oben rechts)
   - Klicke auf "Entpackte Erweiterung laden"
   - Wähle den `browser-extension` Ordner aus

### Produktionsumgebung

1. **Extension bauen**

   ```bash
   npm run build
   ```

2. **Extension verpacken**
   - Verwende Chrome Developer Dashboard oder
   - Erstelle eine .crx Datei für die Verteilung

## Konfiguration

### Backend-Verbindung

Die Extension ist standardmäßig für die lokale Entwicklung konfiguriert:

- **Backend API**: `http://localhost:8080/api/v1`
- **Web-App**: `http://localhost:5173`

Für die Produktion müssen diese URLs in folgenden Dateien angepasst werden:

- `popup.js` - CONFIG Objekt
- `api/api.js` - API_BASE_URL
- `manifest.json` - host_permissions

### Berechtigungen

Die Extension benötigt folgende Berechtigungen:

- `storage` - Für das Speichern von Authentifizierungsdaten
- `tabs` - Für das Erkennen der aktuellen Website
- `activeTab` - Für Autofill-Funktionalität
- `scripting` - Für das Injizieren von Content Scripts

## Verwendung

### Erste Anmeldung

1. Klicke auf das TrustMe Extension-Icon in der Browser-Toolbar
2. Gib deine TrustMe Anmeldedaten ein
3. Klicke auf "Anmelden"

### Passwörter verwenden

1. **Automatische Erkennung**: Die Extension erkennt automatisch Login-Formulare
2. **Popup öffnen**: Klicke auf das Extension-Icon
3. **Passwort auswählen**: Wähle das gewünschte Passwort aus der Liste
4. **Autofill**: Klicke auf "Ausfüllen" oder "Kopieren"

### Web-App öffnen

- Klicke im Popup auf "Web-App öffnen" um die vollständige TrustMe Anwendung zu öffnen
- Hier kannst du neue Passwörter hinzufügen und verwalten

## Architektur

### Komponenten

```
browser-extension/
├── manifest.json          # Extension-Konfiguration
├── popup.html            # Popup-Interface
├── popup.js              # Popup-Logik
├── src/
│   ├── background-scripts/
│   │   └── background.js # Service Worker
│   ├── content-scripts/
│   │   ├── content.js    # Content Script für Autofill
│   │   └── content.css   # Styles für injizierte Elemente
│   └── welcome.html      # Willkommensseite
├── api/
│   └── api.js           # API-Client für Backend-Kommunikation
└── utils/
    └── crypto.js        # Verschlüsselungs-Utilities
```

### Datenfluss

1. **Authentifizierung**: Popup → Background Script → Backend API
2. **Passwort-Laden**: Background Script → Backend API → Entschlüsselung
3. **Autofill**: Content Script → DOM-Manipulation
4. **Synchronisation**: Background Script überwacht Tab-Änderungen

## Sicherheit

### Verschlüsselung

- **Client-seitige Entschlüsselung**: Passwörter werden nur im Browser entschlüsselt
- **Sichere Speicherung**: Authentifizierungsdaten werden in Chrome's sicherem Storage gespeichert
- **HTTPS-Only**: Kommunikation erfolgt nur über verschlüsselte Verbindungen

### Berechtigungen

- **Minimale Berechtigungen**: Nur notwendige Browser-APIs werden verwendet
- **Domain-Beschränkung**: Host-Permissions sind auf TrustMe-Domains beschränkt
- **Content Security Policy**: Verhindert Code-Injection

## Entwicklung

### Debugging

1. **Background Script**: `chrome://extensions/` → Extension Details → "Service Worker" inspizieren
2. **Popup**: Rechtsklick auf Extension-Icon → "Popup inspizieren"
3. **Content Script**: Browser DevTools → Console

### Testing

```bash
# Unit Tests (falls implementiert)
npm test

# Manual Testing
# 1. Lade Extension in Chrome
# 2. Teste verschiedene Websites
# 3. Überprüfe Autofill-Funktionalität
```

### Build

```bash
# Development Build
npm run build:dev

# Production Build
npm run build:prod
```

## Bekannte Einschränkungen

- **2FA-Unterstützung**: Zwei-Faktor-Authentifizierung wird derzeit nur in der Web-App unterstützt
- **Verschlüsselung**: Vollständige Entschlüsselung ist noch nicht implementiert (Platzhalter vorhanden)
- **Offline-Modus**: Extension benötigt Internetverbindung zum Backend

## Roadmap

- [ ] Vollständige Verschlüsselungs-/Entschlüsselungsimplementierung
- [ ] 2FA-Unterstützung in der Extension
- [ ] Offline-Caching für häufig verwendete Passwörter
- [ ] Erweiterte Autofill-Erkennung
- [ ] Passwort-Generator Integration
- [ ] Dark Mode Support

## Support

Bei Problemen oder Fragen:

1. Überprüfe die Browser-Konsole auf Fehlermeldungen
2. Stelle sicher, dass das TrustMe Backend läuft
3. Überprüfe die Netzwerkverbindung
4. Erstelle ein Issue im Repository

## Lizenz

Dieses Projekt ist Teil des TrustMe Password Managers und unterliegt derselben Lizenz.
