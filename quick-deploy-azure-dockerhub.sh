#!/bin/bash

# TrustMe Azure Quick Deployment mit Docker Hub
# Vereinfachtes Deployment ohne eigene Container Registry

set -e

# Farben
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() { echo -e "${BLUE}[INFO]${NC} $1"; }
success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }

# Konfiguration
APP_NAME="trustme"
ENVIRONMENT="prod"
LOCATION="West Europe"
RESOURCE_GROUP="${APP_NAME}-${ENVIRONMENT}-rg"
DOCKER_HUB_USERNAME="christechstarter"  # Docker Hub Username für öffentliche Repos

echo ""
echo "🚀 TrustMe Azure Quick Deploy (Docker Hub)"
echo "============================================"
echo "Vereinfachtes Deployment mit Docker Hub Integration"
echo ""

# Cleanup Funktion
if [ "$1" == "--cleanup" ]; then
    echo "⚠️  WARNUNG: Dies löscht alle Azure-Ressourcen!"
    read -p "Fortfahren? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        log "Lösche Resource Group: $RESOURCE_GROUP"
        az group delete --name "$RESOURCE_GROUP" --yes --no-wait
        success "Cleanup gestartet (läuft im Hintergrund)"
    fi
    exit 0
fi

# Prerequisites prüfen
log "Prüfe Prerequisites..."
if ! command -v az &> /dev/null; then
    error "Azure CLI nicht installiert. Download: https://docs.microsoft.com/cli/azure/install-azure-cli"
    exit 1
fi

# Azure Login
log "Prüfe Azure Login..."
if ! az account show &> /dev/null; then
    log "Azure Login erforderlich..."
    az login
fi
success "Azure Login OK"

# Resource Group erstellen
log "Erstelle Resource Group: $RESOURCE_GROUP"
if ! az group show --name "$resource_group" &> /dev/null; then
    az group create --name "$RESOURCE_GROUP" --location "$LOCATION" --output table
else
    log "Resource Group existiert bereits"
fi

# Secrets generieren
log "Generiere sichere Secrets..."
JWT_SECRET=$(openssl rand -base64 32)
DB_PASSWORD=$(openssl rand -base64 24)

# Docker Hub Parameter vorbereiten
log "Konfiguriere Docker Hub Integration..."
echo "Docker Hub Username: $DOCKER_HUB_USERNAME"
echo "Backend Image: $DOCKER_HUB_USERNAME/trustme-backend:latest"
echo "Frontend Image: $DOCKER_HUB_USERNAME/trustme-frontend:latest"

# Azure Deployment ausführen
log "Starte Azure Container Apps Deployment..."
az deployment group create \
    --resource-group "$RESOURCE_GROUP" \
    --template-file azure-portal-deployment.json \
    --parameters \
        appName="$APP_NAME" \
        environment="$ENVIRONMENT" \
        dockerHubUsername="$DOCKER_HUB_USERNAME" \
        dbAdminPassword="$DB_PASSWORD" \
        jwtSecretKey="$JWT_SECRET" \
    --output table

# URLs ermitteln und anzeigen
log "Ermittle Deployment URLs..."

BACKEND_URL=$(az containerapp show \
    --name "${APP_NAME}-${ENVIRONMENT}-backend" \
    --resource-group "$RESOURCE_GROUP" \
    --query properties.configuration.ingress.fqdn \
    -o tsv 2>/dev/null || echo "Backend URL nicht verfügbar")

FRONTEND_URL=$(az containerapp show \
    --name "${APP_NAME}-${ENVIRONMENT}-frontend" \
    --resource-group "$RESOURCE_GROUP" \
    --query properties.configuration.ingress.fqdn \
    -o tsv 2>/dev/null || echo "Frontend URL nicht verfügbar")

echo ""
echo "========================================"
success "AZURE INFRASTRUCTURE ERFOLGREICH DEPLOYED!"
echo "========================================"
echo -e "${GREEN}Frontend:${NC} https://$FRONTEND_URL"
echo -e "${GREEN}Backend:${NC} https://$BACKEND_URL"
echo -e "${GREEN}Resource Group:${NC} $RESOURCE_GROUP"
echo ""
echo "🐳 NÄCHSTE SCHRITTE - DOCKER IMAGES ERSTELLEN:"
echo "1. Docker Hub Account einrichten (falls noch nicht vorhanden)"
echo "2. Docker Images bauen und pushen:"
echo "   ./deploy-docker-hub.sh"
echo ""
echo "3. Oder GitHub Push für automatisches Deployment:"
echo "   git add . && git commit -m 'deploy' && git push"
echo ""
warn "WICHTIG: Azure Container Apps verwenden Placeholder-Images!"
warn "Echte Docker Images müssen noch gepusht werden."
echo ""
echo "📊 MONITORING:"
echo "- Frontend Status: https://$FRONTEND_URL"
echo "- Backend Health: https://$BACKEND_URL/health"
echo "- Azure Communication Services: Deployed für E-Mail-Funktionen"
echo "- Logs: az containerapp logs show --name ${APP_NAME}-${ENVIRONMENT}-backend --resource-group $RESOURCE_GROUP"
echo ""
echo "🔧 VERWALTUNG:"
echo "- Updates: ./deploy-docker-hub.sh"
echo "- Cleanup: $0 --cleanup"
echo ""
success "Deployment abgeschlossen! 🎉"