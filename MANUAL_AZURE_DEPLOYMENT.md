# TrustMe - Manuelles Azure Deployment Guide

## Voraussetzungen

1. **Azure CLI installiert und eingeloggt**
```bash
az --version
az login
```

2. **Docker Desktop läuft** (für Container Build)

## Schritt 1: Resource Group erstellen

```bash
# Resource Group erstellen
az group create --name trustme-rg --location westeurope
```

## Schritt 2: Parameter-Datei erstellen

Erstelle eine Datei `azure-parameters.json`:

```json
{
  "$schema": "https://schema.management.azure.com/schemas/2019-04-01/deploymentParameters.json#",
  "contentVersion": "1.0.0.0",
  "parameters": {
    "appName": {
      "value": "trustme"
    },
    "environment": {
      "value": "prod"
    },
    "dbAdminUsername": {
      "value": "trustmeadmin"
    },
    "dbAdminPassword": {
      "value": "IhrSicheresPasswort123!"
    },
    "jwtSecretKey": {
      "value": "ihr-super-sicherer-jwt-schluessel-mindestens-32-zeichen-lang"
    }
  }
}
```

## Schritt 3: Bicep Template deployen

```bash
# Bicep Template deployen
az deployment group create \
  --resource-group trustme-rg \
  --template-file azure-container-apps.bicep \
  --parameters @azure-parameters.json
```

## Schritt 4: Container Images bauen und pushen

Nach dem erfolgreichen Deployment:

```bash
# Container Registry Login-Server abrufen
REGISTRY_SERVER=$(az deployment group show \
  --resource-group trustme-rg \
  --name azure-container-apps \
  --query properties.outputs.containerRegistryLoginServer.value \
  --output tsv)

# Bei Container Registry anmelden
az acr login --name ${REGISTRY_SERVER%%.azurecr.io}

# Backend Image bauen und pushen
docker build -t $REGISTRY_SERVER/trustme/backend:latest ./backend
docker push $REGISTRY_SERVER/trustme/backend:latest

# Frontend Image bauen und pushen  
docker build -t $REGISTRY_SERVER/trustme/frontend:latest ./frontend
docker push $REGISTRY_SERVER/trustme/frontend:latest
```

## Schritt 5: Container Apps aktualisieren

```bash
# Backend Container App aktualisieren
az containerapp update \
  --name trustme-prod-backend \
  --resource-group trustme-rg \
  --image $REGISTRY_SERVER/trustme/backend:latest

# Frontend Container App aktualisieren
az containerapp update \
  --name trustme-prod-frontend \
  --resource-group trustme-rg \
  --image $REGISTRY_SERVER/trustme/frontend:latest
```

## Schritt 6: URLs abrufen

```bash
# Backend URL
az deployment group show \
  --resource-group trustme-rg \
  --name azure-container-apps \
  --query properties.outputs.backendUrl.value \
  --output tsv

# Frontend URL
az deployment group show \
  --resource-group trustme-rg \
  --name azure-container-apps \
  --query properties.outputs.frontendUrl.value \
  --output tsv
```

## Wichtige Hinweise

### Sicherheit
- **Ändere die Passwörter** in der Parameter-Datei
- **JWT Secret** sollte mindestens 32 Zeichen lang sein
- **Niemals** Secrets in Git committen

### Kosten
- PostgreSQL Flexible Server: ~€20-30/Monat
- Container Apps: ~€10-20/Monat (je nach Traffic)
- Container Registry: ~€5/Monat

### Monitoring
- Logs sind in Log Analytics verfügbar
- Health Checks sind konfiguriert
- Auto-Scaling ist aktiviert

## Troubleshooting

### Container startet nicht
```bash
# Logs anzeigen
az containerapp logs show \
  --name trustme-prod-backend \
  --resource-group trustme-rg \
  --follow

# Revision Status prüfen
az containerapp revision list \
  --name trustme-prod-backend \
  --resource-group trustme-rg
```

### Datenbank-Verbindung
```bash
# Firewall Rules prüfen
az postgres flexible-server firewall-rule list \
  --resource-group trustme-rg \
  --name trustme-prod-db
```

### SSL-Zertifikate
- Container Apps verwenden automatisch Let's Encrypt
- HTTPS ist standardmäßig aktiviert
- HTTP wird automatisch zu HTTPS umgeleitet

## Cleanup (Optional)

```bash
# Komplette Resource Group löschen
az group delete --name trustme-rg --yes --no-wait
```

## Nächste Schritte

1. **Custom Domain** konfigurieren (optional)
2. **Backup-Strategie** für PostgreSQL einrichten
3. **Monitoring & Alerting** konfigurieren
4. **CI/CD Pipeline** mit GitHub Actions einrichten
