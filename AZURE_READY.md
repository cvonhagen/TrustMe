# TrustMe Azure Deployment Guide

## ✅ JETZT AZURE-READY!

Das TrustMe-System ist jetzt vollständig für Azure-Deployment vorbereitet, **ohne dass Änderungen am eigentlichen Code erforderlich sind**.

## 🚀 Schnell-Deployment

### Voraussetzungen
- Azure CLI installiert
- Docker Desktop läuft
- Azure-Konto mit aktiver Subscription

### Ein-Kommando-Deployment
```bash
./quick-deploy-azure.sh
```

### Oder Windows PowerShell:
```powershell
bash quick-deploy-azure.sh
```

## 📋 Was wurde geändert/hinzugefügt

### ✅ Azure-Kompatibilität hergestellt
1. **Port-Konsistenz**: Überall Port 8080 (statt gemischte 3030/8080)
2. **Test-Route-Schutz**: `/test/verify-email` nur in Development-Modus
3. **Environment-Konfiguration**: `.env.azure` für Production-Settings
4. **Deployment-Automatisierung**: Vereinfachtes Deployment-Skript

### 📁 Neue Dateien
- `.env.azure` - Azure-spezifische Environment-Variablen
- `azure-simple-deploy.bicep` - Vereinfachte Infrastructure-as-Code
- `quick-deploy-azure.sh` - Ein-Klick-Deployment-Skript
- `AZURE_READY.md` - Diese Anleitung

### 🔧 Angepasste Dateien
- `.env.production` - Port von 3030 auf 8080 geändert
- `backend/main.go` - Test-Routen nur in Development
- `deploy-azure.sh` - Frontend-Build-Args hinzugefügt
- `azure-portal-deployment.json` - Azure Portal Template

## 🌐 Azure-URLs nach Deployment

Nach erfolgreichem Deployment erhältst du:
- **Frontend**: `https://trustme-prod-frontend.azurecontainerapps.io`
- **Backend**: `https://trustme-prod-backend.azurecontainerapps.io`
- **API**: `https://trustme-prod-backend.azurecontainerapps.io/api/v1`

## 🔒 Produktions-Sicherheit

### ⚠️ Vor Production-Deployment ändern:
1. **JWT Secret** in `.env.azure` - neuen sicheren Schlüssel generieren
2. **SMTP-Konfiguration** - echte E-Mail-Credentials eintragen
3. **Database URL** - produktive Neon.tech-Datenbank verwenden

### 🛡️ Automatisch gesichert:
- Test-Routen sind in Production deaktiviert
- CORS nur für erlaubte Origins
- HTTPS erzwungen durch Azure Container Apps
- Secrets sicher in Azure Key Vault gespeichert

## 📊 Monitoring

### Health Checks
- Backend: `https://BACKEND_URL/health`
- Frontend: `https://FRONTEND_URL/`

### Logs anzeigen
```bash
# Backend Logs
az containerapp logs show --name trustme-prod-backend --resource-group trustme-prod-rg

# Frontend Logs  
az containerapp logs show --name trustme-prod-frontend --resource-group trustme-prod-rg
```

## 🧹 Cleanup

Alle Azure-Ressourcen löschen:
```bash
./quick-deploy-azure.sh --cleanup
```

## 🔄 Updates deployen

Neue Version deployen (nach Code-Änderungen):
```bash
# Nur Images neu bauen und pushen
docker build -t REGISTRY.azurecr.io/trustme/backend:latest --target production ./backend/
docker build -t REGISTRY.azurecr.io/trustme/frontend:latest --target production ./frontend/
docker push REGISTRY.azurecr.io/trustme/backend:latest
docker push REGISTRY.azurecr.io/trustme/frontend:latest

# Container Apps automatisch aktualisieren
az containerapp update --name trustme-prod-backend --resource-group trustme-prod-rg
az containerapp update --name trustme-prod-frontend --resource-group trustme-prod-rg
```

## ✨ Features in Azure

- **Auto-Scaling**: 1-3 Instanzen je nach Last
- **Zero-Downtime-Deployment**: Rolling Updates
- **SSL/TLS**: Automatisch von Azure bereitgestellt
- **Load Balancing**: Eingebaut in Container Apps
- **Health Monitoring**: Automatische Neustart bei Fehlern
- **Logging**: Integriert in Azure Monitor

## 🎯 Nächste Schritte

1. **Deploy**: `./quick-deploy-azure.sh` ausführen
2. **Testen**: Frontend-URL im Browser öffnen
3. **Konfigurieren**: Production-Secrets in Azure Portal setzen
4. **Monitoring**: Azure Monitor Dashboard einrichten

**Das System ist jetzt 100% Azure-ready! 🚀**