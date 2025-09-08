# TrustMe - Azure Portal Deployment Guide

## Schritt 1: Azure Portal Custom Deployment

1. **Gehe zu Azure Portal**: https://portal.azure.com
2. **Suche nach "Deploy a custom template"** oder gehe zu: https://portal.azure.com/#create/Microsoft.Template
3. **Klicke auf "Build your own template in the editor"**
4. **Kopiere den kompletten Inhalt** aus `azure-portal-deployment.bicep` und füge ihn ein
5. **Klicke "Save"**

## Schritt 2: Parameter eingeben

Fülle die folgenden Parameter aus:

- **Resource Group**: `rg-on-24-09-christoph` (deine existierende RG)
- **App Name**: `trustme`
- **Location**: `West Europe`
- **Environment**: `prod`
- **Db Admin Username**: `trustmeadmin`
- **Db Admin Password**: `TrustMe2024!SecureDB#Password`
- **Jwt Secret Key**: `trustme-jwt-secret-key-2024-production-secure-32-chars-minimum`

## Schritt 3: Deployment starten

1. **Review + Create** klicken
2. **Create** klicken
3. **Warten** (ca. 10-15 Minuten)

## Schritt 4: Nach dem Deployment

Nach erfolgreichem Deployment findest du in den **Outputs**:

- `containerRegistryLoginServer`: z.B. `trustmeregistryabc123.azurecr.io`
- `containerRegistryName`: z.B. `trustmeregistryabc123`
- `backendUrl`: z.B. `https://trustme-prod-backend.kindhill-12345.westeurope.azurecontainerapps.io`
- `frontendUrl`: z.B. `https://trustme-prod-frontend.kindhill-12345.westeurope.azurecontainerapps.io`
- `backendAppName`: `trustme-prod-backend`
- `frontendAppName`: `trustme-prod-frontend`

## Schritt 5: Container Images deployen

Führe diese Befehle aus (ersetze die Werte aus den Outputs):

```bash
# 1. Container Registry Login
az acr login --name trustmeregistryabc123

# 2. Backend Image bauen und pushen
docker build -t trustmeregistryabc123.azurecr.io/trustme/backend:latest ./backend
docker push trustmeregistryabc123.azurecr.io/trustme/backend:latest

# 3. Frontend Image bauen und pushen
docker build -t trustmeregistryabc123.azurecr.io/trustme/frontend:latest ./frontend
docker push trustmeregistryabc123.azurecr.io/trustme/frontend:latest

# 4. Container Apps aktualisieren
az containerapp update \
  --name trustme-prod-backend \
  --resource-group rg-on-24-09-christoph \
  --image trustmeregistryabc123.azurecr.io/trustme/backend:latest

az containerapp update \
  --name trustme-prod-frontend \
  --resource-group rg-on-24-09-christoph \
  --image trustmeregistryabc123.azurecr.io/trustme/frontend:latest
```

## Was wird erstellt:

✅ **PostgreSQL Flexible Server** (Standard_B1ms, 32GB)
✅ **Azure Container Registry** für Docker Images  
✅ **Container Apps Environment** mit Logging
✅ **Backend Container App** mit Auto-Scaling (1-5 Replicas)
✅ **Frontend Container App** mit Auto-Scaling (1-10 Replicas)
✅ **Key Vault** für Secrets
✅ **Log Analytics Workspace** für Monitoring
✅ **HTTPS** mit automatischen SSL-Zertifikaten
✅ **Health Checks** und **Firewall Rules**

## Kosten (ca.):
- PostgreSQL: ~€25/Monat
- Container Apps: ~€15-30/Monat  
- Container Registry: ~€5/Monat
- **Total: ~€45-60/Monat**

## Nach dem Deployment:
Deine TrustMe App ist unter der **Frontend URL** erreichbar und vollständig produktionsbereit!
