# Azure Sandbox Deployment Automation

## Übersicht
Diese Scripts automatisieren den kompletten Deployment-Prozess für die Azure Sandbox-Umgebung:

1. **Docker Images bauen** und nach Docker Hub pushen
2. **Azure Container Apps aktualisieren** mit den neuen Images
3. **Optional**: Git Changes committen und pushen

## Verwendung

### PowerShell (Windows)
```powershell
# Interaktive Ausführung
./azure-push.ps1

# Mit Parametern
./azure-push.ps1 -ResourceGroup "trustme-sandbox-rg" -BackendAppName "trustme-prod-backend" -FrontendAppName "trustme-prod-frontend"
```

### Bash (Linux/macOS/WSL)
```bash
# Ausführbar machen
chmod +x azure-push.sh

# Ausführen
./azure-push.sh
```

## Ablauf

### 1. Vorbereitung
- Prüft Docker und Azure CLI Verfügbarkeit
- Stellt sicher, dass Azure Login aktiv ist
- Optionales Docker Hub Login für höhere Pull-Limits

### 2. Docker Build & Push
- Verwendet das vorhandene `deploy-docker-hub.ps1` / `deploy-docker-hub.sh` Script
- Baut alle Images im Production Mode (`--target production`)
- Pusht Images nach Docker Hub mit korrektem Tagging

### 3. Azure Container Update
- Aktualisiert Backend Container App mit neuem Image
- Aktualisiert Frontend Container App mit neuem Image
- Zeigt finale URLs an

### 4. Optional Git Push
- Committet lokale Änderungen
- Pusht nach GitHub für Backup und Historie

## Vorteile

### 🔄 Automatisierung
- Ein einziger Befehl für den kompletten Deployment-Prozess
- Keine manuellen Schritte mehr nötig
- Weniger Fehlerquellen

### 🛡️ Sandbox-kompatibel
- Funktioniert in eingeschränkten Azure Sandbox-Umgebungen
- Keine globalen Dienste oder Service Principals nötig
- Nur lokale Ressourcen-Updates

### 📦 Konsistenz
- Immer die gleichen Schritte in der gleichen Reihenfolge
- Automatische Prüfung aller Abhängigkeiten
- Klare Erfolgs-/Fehlermeldungen

## Azure Developer CLI Authentifizierung

### Sandbox-kompatibles Login
In der Azure Sandbox-Umgebung wird `azd auth login` statt `az login` verwendet:

```bash
# Prüfen ob authentifiziert
azd auth login --check

# Authentifizieren mit Device Code und fester Tenant-ID
azd auth login --use-device-code --tenant-id 4dfdfd67-3a37-4e2e-b9f0-434c7061ba33
```

### Vorteile der azd Authentifizierung
- **Sandbox-kompatibel**: Funktioniert in eingeschränkten Umgebungen
- **Browser-basiert**: Keine lokale Credential-Speicherung
- **Automatische Token-Verwaltung**: Refresh-Token werden automatisch gehandhabt

## Fehlerbehandlung

### Docker nicht verfügbar
```bash
❌ Docker ist nicht gestartet oder nicht verfügbar
```
**Lösung**: Docker Desktop starten oder Docker Daemon aktivieren

### Azure Login erforderlich
```bash
⚠️  Azure Login erforderlich
```
**Lösung**: Azure Portal im Browser öffnen und einloggen, dann Script erneut ausführen

### Container App Update fehlgeschlagen
```bash
❌ Backend Container App Update fehlgeschlagen
```
**Lösung**: 
1. Ressourcengruppenname prüfen
2. Container App Namen prüfen
3. Azure Berechtigungen prüfen

## Anpassung

### Resource Group und App Namen
Die Scripts fragen interaktiv nach den benötigten Parametern. Alternativ können diese auch direkt übergeben werden.

### Version Tagging
Standardmäßig wird das `latest` Tag verwendet. Alternativ kann eine spezifische Version übergeben werden:

```bash
./azure-push.ps1 -Version "v1.2.3"
./azure-push.sh v1.2.3
```

## Integration in Development Workflow

### Nach Code-Änderungen
1. Code testen und committen
2. `./azure-push.ps1` ausführen
3. Neue Version ist live

### Regelmäßige Updates
- Nach Dependency Updates
- Nach Sicherheitspatches
- Nach Konfigurationsänderungen

## Sicherheit

### Credentials
- Keine festen Credentials in den Scripts
- Nutzung der Azure CLI Authentifizierung
- Optionales Docker Hub Login für bessere Limits

### Berechtigungen
- Nur notwendige Berechtigungen für Container App Updates
- Keine globalen oder subscription-weiten Änderungen
- Sandbox-kompatibel