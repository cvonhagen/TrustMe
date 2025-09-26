# 🛠️🛠️🛠️ UNDER CONSTRUCTION 🛠️🛠️🛠️

<!-- Haupt-README für TrustMe Password Manager Projekt -->
<!-- Zentrale Dokumentation für Entwickler und Benutzer -->
<!-- Enthält Setup-Anweisungen, Architektur-Überblick und Troubleshooting -->




## 🔒 TrustMe - DEIN Passwoatmangaar 😉 🔑🛡️

<!-- Moderner, sicherer Passwort-Manager mit Zero-Knowledge-Architektur -->
<!-- Client-seitige Verschlüsselung, 2FA-Unterstützung und Browser-Integration -->

## ✨ Beschreibung

<!-- Core Value Proposition: Sicherheit + Benutzerfreundlichkeit -->
TrustMe, dat is son moderner und sicha Passwoatmangaar mit eingebauter Zwei-Faktoar-Autentifizierung (2FA) und sonna paktischen Browser-Erweiterung. Ham wa gemacht, damit de deine digitale Anmeldedaten schön sicha verwalten kans.

## 🚀 Wat dat alles kann (Features)

<!-- Kern-Features mit Sicherheitsfokus -->
- Passwoata sicha wegtun durch starke Verschlüsselung. Keina kommt da ran!        <!-- AES-256-GCM client-seitig -->
- Zwei-Faktoar-Autentifizierung (2FA) für noch mehr Sichaheit bei deinem Konto. Doppelt hält besser!  <!-- TOTP-basiert -->
- Browser-Erweiterung für schnelles Ausfüllen und zackig an deine Passwoata rankommen.   <!-- Autofill + Popup -->
- Benutzer registrieren und sicha einloggen. Keina schlüppt unterm Tisch durch.   <!-- JWT + Argon2id -->
- Passwoateinträge machen, zeigen, ändern, wegschmeißen. Alles, wat de brauchst. <!-- CRUD-Operationen -->

## 🛠️ Wat wa benutzt ham (Technologie)

<!-- Technologie-Stack mit Begründung für Auswahl -->
**Hintan (Backend):**
- Go mit Fiber als Web-Framework. Dat rennt wie die Sau!                         <!-- Performance + Typsicherheit -->
- PostgreSQL Datenbank (Neon.tech). Da kommt dat rein, wat rein muss.           <!-- Serverless Postgres -->
- GORM als ORM. Damit quasselt die Anwendung mit der Datenbank.                 <!-- Type-safe DB-Operationen -->
- Argon2id mit PBKDF2 als Fallback für sicheres Passwoat-Hashing. Da beißen sich die Hacker die Zähne aus. <!-- OWASP-konform -->
- AES-256 GCM für die Verschlüsselung von die Passwoatdaten. Richtig dicke Eiche!  <!-- Authenticated encryption -->
- JWT für dat Einloggen. Dein digitaler Ausweis.                               <!-- HMAC-SHA256 Sessions -->

**Vorn (Frontend):**
- React (v19.1.0) mit Material UI (v7.1.1) für die schönen Knöppe und Bildkes.                  <!-- Moderne UI-Komponenten -->
- Vite (v6.3.5) als Werkzeug, dat macht dat schnell.                                     <!-- Lightning-fast HMR -->
- CryptoJS (v4.2.0) für die Zauberei mit die Schlüssel.              <!-- Browser-native Krypto -->

**Browser-Erweiterunk:**
- Manifest V3. Dat is sonne Art Bauanleitunk für die Erweiterunk.              <!-- Modernste Extension-API -->
- React (v18.2.0) mit Material UI (v7.1.1) für die UI
- CryptoJS (v4.2.0) für die client-seitige Verschlüsselung

## 🏁 Wie de dat ans Laufen krichs (Erste Schritte)

Damit de dat Projekt bei dir zu Hause einrichts und anmachs, mach dat ma so:

### Wat de brauchst (Voraussetzungen)

Sieh ma zu, dat die folgenden Sachen auf deinem Rechna sind:
- Go (Ab Version 1.18 oder neuer)
- Node.js (Die, die alle nehmen, is gut)
- npm oder Yarn. Such dir een aus.
- Sonne PostgreSQL-Datenbank. Neon.tech is gut dafür.

### Einrichtung (Setup)

1. Klont dat Repository:
    ```bash
    git clone <repository-url>
    cd TrustMe
    ```
2. Navigiert in dat Backend-Verzeichnis und erstell mal sonne `.env`-Datei wie in dat Beispiel (wenn da eins is). Da kommt eure Datenbank-URL und einen JWT-Key, z.B von https://jwtsecrets.com/ , rein.
    ```bash
    cd backend
    # Mach sonne .env Datei und tu eure DATABASE_URL und JWT_SECRET_KEY da rein
    # Beispiel:
    # DATABASE_URL="postgresql://nutta:Passwoat@Hos:Poat/Datbankname?sslmode=require"
    # JWT_SECRET_KEY="dein_suupa_geheima_jwt_schluessel"
    ```
3. Navigiert in dat Frontend-Verzeichnis und installiert die Sachen, die dat brauch (Abhängigkeiten):
    ```bash
    cd ../frontend
    npm install # oder yarn install
    ```
4. Erstellt sonne `.env.local`-Datei im `frontend`-Verzeichnis und tut eure Backend-API-URL da rein:
    ```
    VITE_API_BASE_URL=http://localhost:8080/api/v1
    ```

### Backend anmachen

Navigiert in dat `backend`-Verzeichnis und führt dat Go-Program an:

```bash
cd backend
go run main.go
```
Dat Backend müsste dann eigentlich auf `http://localhost:8080` loslegen.

### Frontend anmachen

Navigiert in dat `frontend`-Verzeichnis und startet den Entwicklungsserver:

```bash
cd frontend
npm run dev # oder yarn dev
```
Dat Frontend müsste dann in eurem Browser auf `http://localhost:5173` (odde son anna Poat, den Vite dir gibt) aufgehen.

### Browser-Erweiterung anmachen

1. Navigiert in dat `browser-extension`-Verzeichnis.
2. Erstellt dat Projekt (wenn de wat bauen musst - kommt auf euer Setup an).
3. Öffnet euren Browser und geht zu die Einstellungen für die Erweiterungen.
4. Aktiviert den Entwicklermodus.
5. Klickt auf "Entpackte Erweiterung laden" und wählt dat Verzeichnis von die Browser-Erweiterung aus.

### Testdaten machen (Kannste, musste aba nich, nur wenne wills)

Wenn ihr Testdatensätze in eure Datenbank haben möchtet, könnt ihr dat Node.js-Skript verwenden. Stellt sicher, dass dat Backend und dat Frontend laufen, und führt dat Skript vom Projekt-Hauptverzeichnis (`TrustMe`) aus:

```bash
node scripts/generate_data.js
```

## 📁 Wie dat alles aufgebaut is, eigentlich (Projektstruktur)

```
TrustMe/
├── backend/                    # Go Fiber Backend Code
│   ├── handlers/               # HTTP-Handler für API-Endpunkte
│   ├── models/                 # Datenbankmodelle (User, Password)
│   ├── schemas/                # Datenvalidierungsschemas
│   ├── security/               # Sicherheitsfunktionen (Hashing, JWT)
│   ├── services/               # Business-Logik (Auth, User, Password)
│   ├── main.go                 # Hauptanwendungsdatei
│   ├── go.mod                  # Go-Abhängigkeiten
│   └── Dockerfile              # Backend-Container-Definition
├── frontend/                   # React Frontend Code
│   ├── src/                    # Quellcode
│   │   ├── components/         # Wiederverwendbare UI-Komponenten
│   │   ├── pages/              # Seitenkomponenten
│   │   ├── services/           # API-Client
│   │   ├── utils/              # Hilfsfunktionen
│   │   ├── App.jsx             # Hauptanwendungskomponente
│   │   └── main.jsx            # Einstiegspunkt
│   ├── public/                 # Statische Dateien
│   ├── package.json            # Frontend-Abhängigkeiten
│   └── vite.config.js          # Vite-Konfiguration
├── browser-extension/          # Browser-Erweiterung
│   ├── src/                    # Quellcode der Erweiterung
│   │   ├── background-scripts/ # Hintergrundskripte
│   │   ├── content-scripts/    # Injizierte Skripte
│   │   ├── services/           # API-Client
│   │   └── utils/              # Hilfsfunktionen
│   ├── popup.html              # Popup-UI
│   ├── popup.js                # Popup-Logik
│   ├── manifest.json           # Erweiterungs-Manifest
│   ├── package.json            # Extension-Abhängigkeiten
│   └── build.js                # Build-Skript
├── scripts/                    # Hilfsskripte
│   └── generate_data.js        # Testdatengenerator
├── docker-compose.yml          # Container-Orchestrierung
└── README.md                   # Diese Datei
```

## 🐳 Docker Support

Dat Projekt kann auch mit Docker laufen. Dat macht alles einfacher, weil alle Teile in eigene Kästen gepackt sind:

### Mit Docker starten

```bash
# Alles auf einmal anmachen (mit MailHog für E-Mail-Tests)
docker-compose up --build

# Einzelne Services checken
docker-compose ps

# Logs angucken
docker-compose logs backend
docker-compose logs frontend
docker-compose logs browser-extension
docker-compose logs mailhog
```

### Wat läuft wo?

- **Backend**: `http://localhost:8080` (Go/Fiber API)
- **Frontend**: `http://localhost:5173` (React/Vite)
- **MailHog**: `http://localhost:8025` (E-Mail-Interface zum Testen)
- **Browser Extension**: Dateien in `browser-extension/dist/`

### Alles wieder ausmachen

```bash
docker-compose down
```

## 🔧 Troubleshooting - "Failed to fetch" Problem

### Das Problem wat dat?

Wennze "Failed to fetch" Fehler kriegs, dann is dat meist so, datte Services nich richtig miteinander klönen können. Dat Problem lag oft daran, datte API-URLs noch aufde falschen Ports gehangen haben.

### Wat haben wa behoben?

**🔧 Port-Konsistenz hergestellt:**
- **Backend**: Läuft jetz aufm Port **8080** (nich mehr 3030)
- **Frontend**: Zeigt aufn richtigen Backend-Port **8080**
- **Browser Extension**: Alle API-Calls verwenden Port **8080**
- **MailHog**: SMTP aufm Port **1025**, Web-Interface aufm **8025**

**🔧 Docker-Container richtig konfiguriert:**
- Alle Services laufen in eigenem Netzwerk (`trustme-network`)
- Health-Checks für Backend und Frontend
- Hot-Reload für Entwicklung (Air für Backend, Vite für Frontend)
- MailHog für E-Mail-Tests integriert

**🔧 Browser Extension gefixt:**
- `watch.sh` Script-Problem behoben
- Alle API-URLs aufn richtigen Port 8080 gesetzt
- Manifest-Dateien konsistent gemacht
- Docker-Build-Prozess optimiert

### Wat mussde checken wenns nich läuft?

1. **Docker läuft**: `docker --version` sollte wat anzeigen
2. **Services sind up**: `docker-compose ps` - alle sollten "Up" sein
3. **Backend health**: `curl http://localhost:8080/health` sollte `{"status":"healthy"}` zurückgeben
4. **Frontend lädt**: `http://localhost:5173` im Browser öffnen
5. **MailHog läuft**: `http://localhost:8025` für E-Mail-Interface

### Wenns immernoch nich geht:

```bash
# Alles neu starten
docker-compose down
docker-compose --profile dev up -d --build

# Logs checken
docker-compose logs backend
docker-compose logs frontend

# Container neu bauen (Cache leeren)
docker-compose build --no-cache
```

## 🗺️ Wat noch kommt (Zukünftige Erweiterungen)

- Dat mit die Passwoata auf'm Bildschirm noch schöna machen.
- Funktion, die Passwoata für dich macht.
- Passwoata sicha mit andere teilen.
- Auf AWS (odde annere Wolken) hochladen und laufen lassen.
- Dat von alleine bauen, testen und hochladen lassen (CI/CD).

## 📄 Wat dat mit die Rechte is (Lizenz)

Dat Projekt gehört unna die MIT Lizenz. Wenn de mehr wissen willst, guck in die LICENSE Datei (wenn da eine is).