#!/bin/bash

# TrustMe Password Manager - Azure Deployment Script
# Automatisiert das komplette Deployment zu Azure Container Apps

set -e  # Exit on any error

# Farben für Output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging Funktion
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Konfiguration
APP_NAME="trustme"
ENVIRONMENT="prod"
LOCATION="West Europe"
RESOURCE_GROUP="${APP_NAME}-${ENVIRONMENT}-rg"
CONTAINER_REGISTRY="${APP_NAME}registry$(openssl rand -hex 4)"
SUBSCRIPTION_ID=""

# Prüfe ob Azure CLI installiert ist
check_azure_cli() {
    if ! command -v az &> /dev/null; then
        error "Azure CLI ist nicht installiert. Bitte installiere es von: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli"
        exit 1
    fi
}

# Prüfe ob Docker installiert ist
check_docker() {
    if ! command -v docker &> /dev/null; then
        error "Docker ist nicht installiert. Bitte installiere Docker Desktop."
        exit 1
    fi
    
    if ! docker info &> /dev/null; then
        error "Docker läuft nicht. Bitte starte Docker Desktop."
        exit 1
    fi
}

# Azure Login prüfen
check_azure_login() {
    log "Prüfe Azure Login Status..."
    if ! az account show &> /dev/null; then
        warning "Nicht bei Azure angemeldet. Starte Login..."
        az login
    fi
    
    # Subscription setzen falls nicht gesetzt
    if [ -z "$SUBSCRIPTION_ID" ]; then
        SUBSCRIPTION_ID=$(az account show --query id -o tsv)
        log "Verwende Subscription: $SUBSCRIPTION_ID"
    else
        az account set --subscription "$SUBSCRIPTION_ID"
    fi
}

# Resource Group erstellen
create_resource_group() {
    log "Erstelle Resource Group: $RESOURCE_GROUP"
    az group create \
        --name "$RESOURCE_GROUP" \
        --location "$LOCATION" \
        --output table
}

# Container Registry erstellen und konfigurieren
setup_container_registry() {
    log "Erstelle Container Registry: $CONTAINER_REGISTRY"
    az acr create \
        --resource-group "$RESOURCE_GROUP" \
        --name "$CONTAINER_REGISTRY" \
        --sku Basic \
        --admin-enabled true \
        --output table
    
    # Login zur Registry
    log "Login zur Container Registry..."
    az acr login --name "$CONTAINER_REGISTRY"
}

# Docker Images bauen
build_images() {
    log "Baue Docker Images..."
    
    # Backend Image mit Production-Target
    log "Baue Backend Image..."
    docker build -t "${CONTAINER_REGISTRY}.azurecr.io/trustme/backend:latest" \
        --target production \
        --file ./backend/Dockerfile \
        ./backend/
    
    # Frontend Image mit Production-Target
    log "Baue Frontend Image..."
    docker build -t "${CONTAINER_REGISTRY}.azurecr.io/trustme/frontend:latest" \
        --target production \
        --build-arg VITE_BACKEND_URL=https://${APP_NAME}-${ENVIRONMENT}-backend.azurecontainerapps.io/api/v1 \
        --file ./frontend/Dockerfile \
        ./frontend/
    
    success "Docker Images erfolgreich gebaut"
}

# Images zu Registry pushen
push_images() {
    log "Pushe Images zur Azure Container Registry..."
    
    docker push "${CONTAINER_REGISTRY}.azurecr.io/trustme/backend:latest"
    docker push "${CONTAINER_REGISTRY}.azurecr.io/trustme/frontend:latest"
    
    success "Images erfolgreich gepusht"
}

# Secrets generieren
generate_secrets() {
    log "Generiere Secrets..."
    
    # JWT Secret
    JWT_SECRET=$(openssl rand -base64 32)
    
    # Database Password
    DB_PASSWORD=$(openssl rand -base64 24 | tr -d "=+/" | cut -c1-16)
    
    log "Secrets generiert (werden sicher in Bicep Template verwendet)"
}

# Bicep Deployment
deploy_infrastructure() {
    log "Deploye Infrastructure mit Bicep..."
    
    az deployment group create \
        --resource-group "$RESOURCE_GROUP" \
        --template-file azure-container-apps.bicep \
        --parameters \
            appName="$APP_NAME" \
            location="$LOCATION" \
            environment="$ENVIRONMENT" \
            containerRegistryName="$CONTAINER_REGISTRY" \
            dbAdminPassword="$DB_PASSWORD" \
            jwtSecretKey="$JWT_SECRET" \
        --output table
    
    success "Infrastructure erfolgreich deployed"
}

# Container Apps aktualisieren mit neuen Images
update_container_apps() {
    log "Aktualisiere Container Apps mit neuen Images..."
    
    # Backend App Update
    az containerapp update \
        --name "${APP_NAME}-${ENVIRONMENT}-backend" \
        --resource-group "$RESOURCE_GROUP" \
        --image "${CONTAINER_REGISTRY}.azurecr.io/trustme/backend:latest"
    
    # Frontend App Update
    az containerapp update \
        --name "${APP_NAME}-${ENVIRONMENT}-frontend" \
        --resource-group "$RESOURCE_GROUP" \
        --image "${CONTAINER_REGISTRY}.azurecr.io/trustme/frontend:latest"
    
    success "Container Apps erfolgreich aktualisiert"
}

# Deployment Status prüfen
check_deployment_status() {
    log "Prüfe Deployment Status..."
    
    # Backend URL
    BACKEND_URL=$(az containerapp show \
        --name "${APP_NAME}-${ENVIRONMENT}-backend" \
        --resource-group "$RESOURCE_GROUP" \
        --query properties.configuration.ingress.fqdn \
        -o tsv)
    
    # Frontend URL
    FRONTEND_URL=$(az containerapp show \
        --name "${APP_NAME}-${ENVIRONMENT}-frontend" \
        --resource-group "$RESOURCE_GROUP" \
        --query properties.configuration.ingress.fqdn \
        -o tsv)
    
    echo ""
    success "=== DEPLOYMENT ERFOLGREICH ==="
    echo -e "${GREEN}Frontend URL:${NC} https://$FRONTEND_URL"
    echo -e "${GREEN}Backend URL:${NC} https://$BACKEND_URL"
    echo -e "${GREEN}Container Registry:${NC} $CONTAINER_REGISTRY.azurecr.io"
    echo ""
}

# Cleanup Funktion
cleanup() {
    if [ "$1" == "--cleanup" ]; then
        warning "Lösche Resource Group: $RESOURCE_GROUP"
        read -p "Bist du sicher? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            az group delete --name "$RESOURCE_GROUP" --yes --no-wait
            success "Cleanup gestartet"
        fi
        exit 0
    fi
}

# Main Deployment Funktion
main() {
    echo -e "${BLUE}"
    echo "========================================="
    echo "  TrustMe Password Manager Deployment"
    echo "========================================="
    echo -e "${NC}"
    
    # Cleanup Option
    cleanup "$1"
    
    # Prerequisites prüfen
    log "Prüfe Prerequisites..."
    check_azure_cli
    check_docker
    check_azure_login
    
    # Deployment Steps
    create_resource_group
    setup_container_registry
    generate_secrets
    build_images
    push_images
    deploy_infrastructure
    update_container_apps
    check_deployment_status
    
    success "Deployment abgeschlossen! 🚀"
}

# Script ausführen
main "$@"