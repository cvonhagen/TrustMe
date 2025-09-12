#!/bin/bash

# TrustMe Azure Quick Deploy Script
# Vereinfachtes Deployment ohne Code-Änderungen erforderlich

set -e

# Farben
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

log() { echo -e "${BLUE}[INFO]${NC} $1"; }
success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Konfiguration
APP_NAME="trustme"
ENVIRONMENT="prod"
LOCATION="West Europe"
RESOURCE_GROUP="${APP_NAME}-${ENVIRONMENT}-rg"
REGISTRY_NAME="${APP_NAME}registry$(openssl rand -hex 4)"

# Prüfe Prerequisites
check_prerequisites() {
    log "Prüfe Prerequisites..."
    
    if ! command -v az &> /dev/null; then
        error "Azure CLI nicht installiert. Download: https://docs.microsoft.com/cli/azure/install-azure-cli"
        exit 1
    fi
    
    if ! command -v docker &> /dev/null; then
        error "Docker nicht installiert. Download: https://docker.com"
        exit 1
    fi
    
    if ! docker info &> /dev/null; then
        error "Docker läuft nicht. Bitte starte Docker Desktop."
        exit 1
    fi
}

# Azure Login
azure_login() {
    log "Prüfe Azure Login..."
    if ! az account show &> /dev/null; then
        log "Azure Login erforderlich..."
        az login
    fi
    success "Azure Login OK"
}

# Resource Group erstellen
create_resource_group() {
    log "Erstelle Resource Group: $RESOURCE_GROUP"
    az group create --name "$RESOURCE_GROUP" --location "$LOCATION" --output table
}

# Container Registry erstellen
create_registry() {
    log "Erstelle Container Registry: $REGISTRY_NAME"
    az acr create \
        --resource-group "$RESOURCE_GROUP" \
        --name "$REGISTRY_NAME" \
        --sku Basic \
        --admin-enabled true \
        --output table
    
    log "Login zur Registry..."
    az acr login --name "$REGISTRY_NAME"
}

# Docker Images bauen und pushen
build_and_push() {
    log "Baue und pushe Docker Images..."
    
    # Backend
    log "Baue Backend Image..."
    docker build -t "${REGISTRY_NAME}.azurecr.io/trustme/backend:latest" \
        --target production \
        --file ./backend/Dockerfile \
        ./backend/
    
    # Frontend mit Production-URL
    log "Baue Frontend Image..."
    docker build -t "${REGISTRY_NAME}.azurecr.io/trustme/frontend:latest" \
        --target production \
        --build-arg VITE_BACKEND_URL=https://${APP_NAME}-${ENVIRONMENT}-backend.azurecontainerapps.io/api/v1 \
        --file ./frontend/Dockerfile \
        ./frontend/
    
    log "Pushe Images..."
    docker push "${REGISTRY_NAME}.azurecr.io/trustme/backend:latest"
    docker push "${REGISTRY_NAME}.azurecr.io/trustme/frontend:latest"
    
    success "Images erfolgreich gepusht"
}

# Secrets generieren
generate_secrets() {
    log "Generiere Secrets..."
    JWT_SECRET=$(openssl rand -base64 32)
    DB_PASSWORD=$(openssl rand -base64 24)
}

# Azure Container Apps deployen
deploy_apps() {
    log "Deploye Container Apps..."
    
    # Bicep Deployment
    az deployment group create \
        --resource-group "$RESOURCE_GROUP" \
        --template-file azure-simple-deploy.bicep \
        --parameters \
            appName="$APP_NAME" \
            environment="$ENVIRONMENT" \
            location="$LOCATION" \
            containerRegistryName="$REGISTRY_NAME" \
            jwtSecretKey="$JWT_SECRET" \
        --output table
    
    success "Container Apps deployed"
}

# URLs anzeigen
show_urls() {
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
    success "DEPLOYMENT ERFOLGREICH ABGESCHLOSSEN!"
    echo "========================================"
    echo -e "${GREEN}Frontend:${NC} https://$FRONTEND_URL"
    echo -e "${GREEN}Backend:${NC} https://$BACKEND_URL"
    echo -e "${GREEN}Registry:${NC} $REGISTRY_NAME.azurecr.io"
    echo ""
    echo "HINWEISE:"
    echo "- Die erste Startzeit kann 2-3 Minuten dauern"
    echo "- Health Checks benötigen Zeit zum Stabilisieren"
    echo "- Bei Problemen: az containerapp logs show --name ${APP_NAME}-${ENVIRONMENT}-backend --resource-group $RESOURCE_GROUP"
    echo ""
}

# Cleanup Funktion
cleanup() {
    if [ "$1" == "--cleanup" ]; then
        echo "WARNUNG: Dies löscht alle Azure-Ressourcen!"
        read -p "Fortfahren? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            log "Lösche Resource Group: $RESOURCE_GROUP"
            az group delete --name "$RESOURCE_GROUP" --yes --no-wait
            success "Cleanup gestartet (läuft im Hintergrund)"
        fi
        exit 0
    fi
}

# Main
main() {
    echo ""
    echo "🚀 TrustMe Azure Quick Deploy 🚀"
    echo "================================="
    echo ""
    
    cleanup "$1"
    
    check_prerequisites
    azure_login
    create_resource_group
    create_registry
    generate_secrets
    build_and_push
    deploy_apps
    show_urls
}

main "$@"