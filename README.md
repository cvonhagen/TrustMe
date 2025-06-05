# TrustMe Passwort Manager

Dies ist eine sichere Passwort-Manager-Anwendung mit einem Web-Frontend, einer Browser-Erweiterung und einem Python-Backend. Das Projekt zielt darauf ab, eine robuste Lösung für die Verwaltung sensibler Anmeldedaten zu bieten, mit Fokus auf Sicherheit, Benutzerfreundlichkeit und moderne Technologie-Stacks.

## Aktueller Stand

Das Projekt befindet sich in aktiver Entwicklung. Die grundlegenden Strukturen für das Backend und das Frontend sind eingerichtet, und die Kernfunktionalitäten werden implementiert.

### Backend (FastAPI)

*   Grundlegende Struktur eingerichtet.
*   Authentifizierung (Registrierung, Login) implementiert.
*   CRUD-Operationen für Benutzer und Passwörter implementiert.
*   Vorbereitungen und Endpunkte für die Zwei-Faktor-Authentifizierung (2FA) sind implementiert.

### Frontend (React mit Vite, Material UI)

*   Projekt mit Vite erstellt und konfiguriert.
*   Grundlegendes Routing für Login, Registrierung und Dashboard eingerichtet.
*   API-Service zur Kommunikation mit dem Backend erstellt.
*   Client-seitige Verschlüsselungsfunktionen (Schlüsselableitung, Entschlüsselung) implementiert.
*   Login-, Registrierungs- und 2FA-Seiten sind in Arbeit.
*   Material Design (MUI) mit Light/Dark-Modus eingerichtet.

### Browser-Erweiterung (React)

*   Grundlegende Projektstruktur für Popup, Background-Script und Content-Script erstellt.

### Infrastruktur & Deployment

*   `docker-compose.yml` für die lokale Entwicklung von Backend und Frontend vorbereitet.
*   Dockerfiles für Backend und Frontend erstellt/aktualisiert.
*   GitHub Actions Workflows für CI/CD sind in Vorbereitung.

## Verzeichnisstruktur

```
TrustMe/
├── .github/           # GitHub Actions Workflows
│   └── workflows/
├── backend/           # FastAPI Backend
│   ├── app/
│   │   ├── api/
│   │   │   └── v1/
│   │   │       └── endpoints/
│   │   ├── core/
│   │   ├── crud/
│   │   ├── models/
│   │   └── schemas/
│   ├── core/          # Kernkonfiguration und -funktionen
│   ├── db/            # Datenbank-bezogene Dateien (Migrationen etc.)
│   ├── scripts/       # Skripte für Setup und Verwaltung
│   ├── .env.example   # Beispiel-Umgebungsdateien
│   ├── Dockerfile
│   └── requirements.txt
├── browser-extension/ # Browser-Erweiterung
│   ├── public/        # Manifest und statische Assets
│   ├── src/           # Erweiterungs-Code (Popup, Background, Content)
│   │   └── api/       # API-Service für die Erweiterung
│   ├── .env.example   # Beispiel-Umgebungsdateien
│   └── package.json
├── frontend/          # React Web-Frontend
│   ├── public/        # Statische Assets
│   ├── src/           # Frontend-Code
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/  # API-Service
│   │   └── utils/     # Hilfsfunktionen (Krypto)
│   ├── .env.example   # Beispiel-Umgebungsdateien
│   ├── Dockerfile
│   ├── package.json
│   └── nginx.conf     # Nginx Konfiguration für SPA
├── docker-compose.yml # Docker Compose Datei
├── .gitignore
└── README.md
```

## Zukünftige Pläne

Folgende Schritte sind als Nächstes geplant oder noch offen:

*   Vollständige Implementierung und Integration der Zwei-Faktor-Authentifizierung im Frontend und Backend.
*   Fertigstellung der Frontend-Dashboard-Seite (Anzeige und Verwaltung von Passwörtern).
*   Implementierung der vollständigen Logik für die Browser-Erweiterung (Auto-Ausfüllen, Speichern von Passwörtern).
*   Fertigstellung der CI/CD-Pipelines mit GitHub Actions für das automatische Bauen und Testen.
*   Vorbereitung und Durchführung des Deployments auf AWS (z.B. ECS für Container, RDS für die Datenbank).
*   Hinzufügen weiterer Sicherheits- und Komfortfunktionen (z.B. Passwortstärke-Prüfung, Sicheres Teilen von Passwörtern).
*   Umfassende Tests (Unit-, Integrations- und Sicherheitstests).
