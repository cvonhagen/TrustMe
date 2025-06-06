# 🔒 TrustMe - DEIN Passwoatmangaar 😉 🔑🛡️

## ✨ Beschreibung

TrustMe, dat is son moderner und sicha Passwoatmangaar mit eingebauter Zwei-Faktoar-Autentifizierung (2FA) und sonna paktischen Browser-Erweiterung. Ham wa gemacht, damit de deine digitale Anmeldedaten schön sicha verwalten kans.

## 🚀 Wat dat alles kann (Features)

- Passwoata sicha wegtun durch starke Verschlüsselung. Keina kommt da ran!
- Zwei-Faktoar-Autentifizierung (2FA) für noch mehr Sichaheit bei deinem Konto. Doppelt hält besser!
- Browser-Erweiterung für schnelles Ausfüllen und zackig an deine Passwoata rankommen.
- Benutzer registrieren und sicha einloggen. Keina schlüppt unterm Tisch durch.
- Passwoateinträge machen, zeigen, ändern, wegschmeißen. Alles, wat de brauchst.

## 🛠️ Wat wa benutzt ham (Technologie)

**Hintan (Backend):**
- Go mit Fiber als Web-Framework. Dat rennt wie die Sau!
- PostgreSQL Datenbank (Neon.tech). Da kommt dat rein, wat rein muss.
- GORM als ORM. Damit quasselt die Anwendung mit der Datenbank.
- PBKDF2 mit SHA-256 für sicheres Passwoat-Hashing. Da beißen sich die Hacker die Zähne aus.
- AES-256 GCM für die Verschlüsselung von die Passwoatdaten. Richtig dicke Eiche!
- JWT für dat Einloggen. Dein digitaler Ausweis.

**Vorn (Frontend):**
- React mit Material UI für die schönen Knöppe und Bildkes.
- Vite als Werkzeug, dat macht dat schnell.
- Web Crypto API und CryptoJS für die Zauberei mit die Schlüssel.

**Browser-Erweiterunk:**
- Manifest V3. Dat is sonne Art Bauanleitunk für die Erweiterunk.

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
2. Navigiert in dat Backend-Verzeichnis und erstell mal sonne `.env`-Datei wie in dat Beispiel (wenn da eins is). Da kommt eure Datenbank-URL und einen JWT-Key, z.B von https://jwtsecret.com/generate , rein.
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
    VITE_API_BASE_URL=http://localhost:3030/api/v1
    ```

### Backend anmachen

Navigiert in dat `backend`-Verzeichnis und führt dat Go-Program an:

```bash
cd backend
go run main.go
```
Dat Backend müsste dann eigentlich auf `http://localhost:3030` loslegen.

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
├── backend/               # Go Fiber Backend Code
│   ├── handlers/          # Wat reinkommt, wird verarbeitet
│   ├── models/            # Wie die Sachen in die Datenbank passen
│   ├── security/          # Wat mit Sichaheit zu tun hat (Verschlüsselung, Schlüssel)
│   ├── services/          # Hier passiert die Hauptsache
│   ├── main.go            # Hier geht alles los
│   └── go.mod             # Sagt, welche Go-Sachen dat Projekt brauch
├── frontend/              # React Frontend Code
│   ├── public/            # Sachen, die jeder sehen kann
│   ├── src/               # Der Quellcode von dat Vorn
│   │   ├── components/    # Kleine Teile, die de immer wieder brauchst
│   │   ├── pages/         # Die ganzen Bildschirmkes (Einloggen, Registrieren, etc.)
│   │   ├── services/      # Redet mit dat Hintan
│   │   └── utils/         # Kleine Helferkes (wie dat die Schlüssel)
│   ├── index.html         # Die erste Seite
│   ├── package.json       # Sagt, welche Node.js-Sachen dat Projekt brauch
│   └── vite.config.js     # Wie dat Vite dat alles zusammenpackt
├── browser-extension/     # Code für die Erweiterung
│   ├── public/            # Sachen für die Erweiterung
│   ├── src/               # Quellcode von die Erweiterung
│   │   ├── background/    # Läuft im Hintergrund
│   │   ├── content/       # Schnüffelt auf die Webseiten
│   │   └── popup/         # Wat aufgeht, wenn de draufklickst
│   └── manifest.json      # Die Regeln für die Erweiterung
└── scripts/               # Sonstige Skripte
    └── generate_data.js   # Macht Testdaten über die Hintertür (API)
```

## 🗺️ Wat noch kommt (Zukünftige Erweiterungen)

- Dat mit die Passwoata auf'm Bildschirm noch schöna machen.
- Noch mehr Möglichkeiten für 2FA.
- Funktion, die Passwoata für dich macht.
- Passwoata sicha mit andere teilen.
- Dat als Programm auf'm Rechna (nich nur im Browser).
- Dat in so Kisten packen (Docker-Container).
- Auf AWS (odde annere Wolken) hochladen und laufen lassen.
- Dat von alleine bauen, testen und hochladen lassen (CI/CD).

## 📄 Wat dat mit die Rechte is (Lizenz)

Dat Projekt gehört unna die MIT Lizenz. Wenn de mehr wissen willst, guck in die LICENSE Datei (wenn da eine is).
