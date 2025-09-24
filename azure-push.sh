#!/bin/bash

# azure-push.sh - Automatisches Deployment für Azure Sandbox
# Baut Docker Images, pusht sie nach Docker Hub und updated Azure Container Apps

set -e

# Farben
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

log() { echo -e "${BLUE}[INFO]${NC} $1"; }
success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
header() { echo -e "${CYAN}$1${NC}"; }

# Parameter abfragen
echo ""
header "🚀 Azure Sandbox Deployment Automation"
echo "====================================="
echo -n "Azure Resource Group Name eingeben: "
read RESOURCE_GROUP
echo -n "Backend App Name eingeben (z.B. trustme-prod-backend): "
read BACKEND_APP_NAME
echo -n "Frontend App Name eingeben (z.B. trustme-prod-frontend): "
read FRONTEND_APP_NAME
VERSION=${1:-latest}

echo ""
echo "📦 Konfiguration:"
echo "Resource Group: $RESOURCE_GROUP"
echo "Backend App: $BACKEND_APP_NAME"
echo "Frontend App: $FRONTEND_APP_NAME"
echo "Version: $VERSION"
echo ""

# Prüfen ob Docker läuft
log "Prüfe Docker..."
if ! docker info >/dev/null 2>&1; then
    error "Docker ist nicht gestartet oder nicht verfügbar"
    exit 1
fi
success "Docker ist verfügbar"

# Prüfen ob Azure CLI installiert ist
log "Prüfe Azure CLI..."
if ! command -v az &> /dev/null; then
    error "Azure CLI ist nicht installiert"
    exit 1
fi
success "Azure CLI ist installiert"

# Prüfen ob eingeloggt in Azure
log "Prüfe Azure Developer CLI Login..."
if ! azd auth login --check &> /dev/null; then
    warn "Azure Developer CLI Login erforderlich"
    echo "Öffne den Link in deinem Browser und folge den Anweisungen:"
    azd auth login --use-device-code --tenant-id 4dfdfd67-3a37-4e2e-b9f0-434c7061ba33
    if [ $? -ne 0 ]; then
        error "Azure Developer CLI Login fehlgeschlagen"
        exit 1
    fi
    success "Azure Developer CLI Login erfolgreich"
else
    success "Azure Developer CLI Login aktiv"
fi

echo ""
header "📦 Schritt 1: Docker Images bauen und pushen"
echo "==========================================="

# Docker Hub Login (optional für höhere Pull-Limits)
log "Docker Hub Login (optional)..."
echo "Docker Hub Login ausführen? (y/n) [Standard: n]: "
read login_choice
if [[ "$login_choice" =~ ^([yY][eE][sS]|[yY])$ ]]; then
    if docker login; then
        success "Docker Hub Login erfolgreich"
    else
        warn "Docker Hub Login fehlgeschlagen"
    fi
else
    log "Login übersprungen"
fi

# Docker Images bauen und pushen über vorhandenes Script
log "Führe Docker Hub Deployment aus..."
if ./deploy-docker-hub.sh "$VERSION"; then
    success "Docker Images erfolgreich gebaut und gepusht"
else
    error "Docker Images Build/Push fehlgeschlagen"
    exit 1
fi

echo ""
header "🔄 Schritt 2: Azure Container Apps aktualisieren"
echo "============================================="

# Backend Container App aktualisieren
log "Aktualisiere Backend Container App: $BACKEND_APP_NAME"
if az containerapp update \
    --name "$BACKEND_APP_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --image "christechstarter/trustme-backend:$VERSION"; then
    success "Backend Container App erfolgreich aktualisiert"
else
    error "Backend Container App Update fehlgeschlagen"
    exit 1
fi

# Frontend Container App aktualisieren
log "Aktualisiere Frontend Container App: $FRONTEND_APP_NAME"
if az containerapp update \
    --name "$FRONTEND_APP_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --image "christechstarter/trustme-frontend:$VERSION"; then
    success "Frontend Container App erfolgreich aktualisiert"
else
    error "Frontend Container App Update fehlgeschlagen"
    exit 1
fi

echo ""
header "📋 Schritt 3: Deployment Zusammenfassung"
echo "====================================="

# URLs ermitteln
log "Ermittle Deployment URLs..."
BACKEND_URL=$(az containerapp show \
    --name "$BACKEND_APP_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --query properties.configuration.ingress.fqdn \
    -o tsv 2>/dev/null || echo "Backend URL nicht verfügbar")

FRONTEND_URL=$(az containerapp show \
    --name "$FRONTEND_APP_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --query properties.configuration.ingress.fqdn \
    -o tsv 2>/dev/null || echo "Frontend URL nicht verfügbar")

success "Deployment erfolgreich abgeschlossen!"
echo ""
header "🌐 Zugriffspunkte:"
echo "   Frontend: https://$FRONTEND_URL"
echo "   Backend:  https://$BACKEND_URL"
echo ""
header "📦 Verwendete Images:"
echo "   Backend:  christechstarter/trustme-backend:$VERSION"
echo "   Frontend: christechstarter/trustme-frontend:$VERSION"
echo ""
header "🔧 Nächste Schritte:"
echo "   • Änderungen committen: git add . && git commit -m 'update'"
echo "   • Änderungen pushen:    git push"
echo "   • Script erneut ausführen für neue Updates"
echo ""
success "🎉 Azure Sandbox Deployment abgeschlossen!"

# Optional: GitHub Push
echo ""
echo "Git Changes committen und pushen? (y/n) [Standard: n]: "
read git_choice
if [[ "$git_choice" =~ ^([yY][eE][sS]|[yY])$ ]]; then
    log "Git Push wird ausgeführt..."
    git add .
    git commit -m "Azure Deployment Update - $(date)"
    if git push; then
        success "Git Push erfolgreich"
    else
        warn "Git Push fehlgeschlagen"
    fi
fi