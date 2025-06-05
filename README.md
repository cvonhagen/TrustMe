# TrustMe Passwort Manager ✨

Willkommen bei TrustMe! 👋 Dies ist mehr als nur ein Passwort-Manager – es ist eine robuste und sichere Lösung, die dir hilft, deine digitalen Anmeldedaten mühelos zu verwalten. Mit einem modernen Web-Frontend, einer praktischen Browser-Erweiterung und einem leistungsstarken Python-Backend konzentriert sich TrustMe auf Sicherheit, Benutzerfreundlichkeit und den Einsatz moderner Technologien.

Unser Ziel ist es, dir ein sicheres Gefühl im Internet zu geben, indem wir den Schutz deiner Passwörter vereinfachen. 🔒

## Aktueller Entwicklungsstand 🏗️

Das Projekt TrustMe ist in aktiver Entwicklung! Wir bauen Schritt für Schritt eine solide Anwendung auf. Hier ist, wo wir gerade stehen:

### Backend (FastAPI) 🐍

* Basisstruktur steht. ✅
* User-Authentifizierung (Registrierung, Login) ist implementiert. 🔐
* CRUD-Operationen für deine Passwörter sind vorhanden. ✍️
* Die Endpunkte für die Zwei-Faktor-Authentifizierung (2FA) sind integriert. 📱

### Frontend (React mit Vite, Material UI) ⚛️

* Das Projekt wurde schnell mit Vite eingerichtet und konfiguriert. ⚡
* Grundlegendes Routing für die wichtigsten Seiten (Login, Registrierung, Dashboard) ist fertig. 🛣️
* Ein API-Service für die Kommunikation mit dem Backend wurde erstellt. 🔗
* Wichtige client-seitige Krypto-Funktionen sind implementiert. 🔑
* Wir arbeiten gerade an den Login-, Registrierungs- und 2FA-Seiten. 🚧
* Ein schickes Material Design (MUI) mit Light/Dark-Modus ist eingerichtet. 🎨

### Browser-Erweiterung (React) 🦊🔑

* Die grundlegende Struktur für Popup, Background- und Content-Skripte steht. 🏗️

### Infrastruktur & Deployment ☁️🐳

* `docker-compose.yml` ist für die lokale Entwicklung vorbereitet. ⚙️
* Dockerfiles für Backend und Frontend sind erstellt/aktualisiert. 🚢
* CI/CD-Pipelines mit GitHub Actions sind in Vorbereitung. 🚀

## Projektstruktur 📁

Hier ist ein Überblick über den Aufbau des Projekts:

```
TrustMe/
├── .github/           # GitHub Actions Workflows 🛠️
│   └── workflows/
├── backend/           # FastAPI Backend 🐍
│   ├── app/
│   │   ├── api/
│   │   │   └── v1/
│   │   │       └── endpoints/
│   │   ├── core/
│   │   ├── crud/
│   │   ├── models/
│   │   └── schemas/
│   ├── core/
│   ├── db/
│   ├── scripts/
│   ├── .env.example   # Beispiel-Umgebungsdateien 📝
│   ├── Dockerfile
│   └── requirements.txt
├── browser-extension/ # Browser-Erweiterung 🦊🔑
│   ├── public/
│   ├── src/
│   │   └── api/
│   ├── .env.example   # Beispiel-Umgebungsdateien 📝
│   └── package.json
├── frontend/          # React Web-Frontend ⚛️
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   └── utils/
│   ├── .env.example   # Beispiel-Umgebungsdateien 📝
│   ├── Dockerfile
│   ├── package.json
│   └── nginx.conf
├── docker-compose.yml # Docker Compose Datei 🐳
├── .gitignore         # Ignorierte Dateien 🙈
└── README.md          # Diese Datei! 😉
```

## Was als Nächstes kommt roadmap

Unsere Reise mit TrustMe geht weiter! Hier sind die nächsten wichtigen Schritte und geplanten Features: 🗺️➡️

* Komplette Integration der Zwei-Faktor-Authentifizierung im Frontend und Backend. ✅🔄📱
* Fertigstellung des Frontend-Dashboards zur vollen Verwaltung deiner Passwörter. 📊🔑
* Implementierung der smarten Logik für die Browser-Erweiterung (Auto-Ausfüllen, einfaches Speichern). 🤖💾
* Finalisierung der CI/CD-Workflows für reibungsloses Bauen und Deployment. 🏗️✅🚀
* Vorbereitung und Durchführung des Deployments auf AWS. ☁️🚀
* Hinzufügen weiterer nützlicher Features und Sicherheitsverbesserungen (z.B. Passwortstärke-Check, sicheres Teilen). ✨🛡️
* Umfassende Testabdeckung für Stabilität und Sicherheit. 🧪🔒

Bleib dran für weitere Updates! ✨
