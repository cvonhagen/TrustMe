#!/bin/bash

# TrustMe Docker Hub Deployment Script
# Baut Docker Images und pusht sie nach Docker Hub für Azure Container Apps

set -e

# Konfiguration
DOCKER_HUB_USERNAME="christechstarter"  # Docker Hub Username für öffentliche Repos
BACKEND_IMAGE="$DOCKER_HUB_USERNAME/trustme-backend"
FRONTEND_IMAGE="$DOCKER_HUB_USERNAME/trustme-frontend"
BROWSER_EXT_IMAGE="$DOCKER_HUB_USERNAME/trustme-browser-extension"
VERSION=${1:-latest}  # Version aus Parameter oder 'latest'

echo "🔐 TrustMe Docker Hub Deployment"
echo "================================="
echo "Docker Hub Username: $DOCKER_HUB_USERNAME"
echo "Backend Image: $BACKEND_IMAGE:$VERSION"
echo "Frontend Image: $FRONTEND_IMAGE:$VERSION"
echo "Browser Extension Image: $BROWSER_EXT_IMAGE:$VERSION"
echo ""

# Prüfen ob Docker läuft
if ! docker info >/dev/null 2>&1; then
    echo "❌ Docker ist nicht gestartet oder nicht verfügbar"
    exit 1
fi

# Docker Hub Login (für öffentliche Repos optional)
echo "🔑 Docker Hub Login (optional für öffentliche Repos)..."
echo "Für öffentliche Repos ist kein Login nötig, aber empfohlen für höhere Pull-Limits"
read -p "Docker Hub Login ausführen? (y/n) [Standard: n]: " -r
if [[ $REPLY =~ ^[Yy]$ ]]; then
    if ! docker login; then
        echo "⚠️   Docker Hub Login fehlgeschlagen, aber weitermachen für öffentliche Repos"
    fi
else
    echo "ℹ️   Login übersprungen - nutze anonyme öffentliche Repo-Berechtigung"
fi

# Backend Docker Image bauen
echo ""
echo "🔨 Backend Docker Image bauen..."
echo "Building: $BACKEND_IMAGE:$VERSION"
if ! docker build --target production -t "$BACKEND_IMAGE:$VERSION" ./backend; then
    echo "❌ Backend Build fehlgeschlagen"
    exit 1
fi
echo "✅ Backend Image gebaut"

# Frontend Docker Image bauen
echo ""
echo "🔨 Frontend Docker Image bauen..."
echo "Building: $FRONTEND_IMAGE:$VERSION"
if ! docker build --target production -t "$FRONTEND_IMAGE:$VERSION" ./frontend; then
    echo "❌ Frontend Build fehlgeschlagen"
    exit 1
fi
echo "✅ Frontend Image gebaut"

# Browser Extension Docker Image bauen
echo ""
echo "🔨 Browser Extension Docker Image bauen..."
echo "Building: $BROWSER_EXT_IMAGE:$VERSION"
if ! docker build --target production -t "$BROWSER_EXT_IMAGE:$VERSION" ./browser-extension; then
    echo "❌ Browser Extension Build fehlgeschlagen"
    exit 1
fi
echo "✅ Browser Extension Image gebaut"

# Backend Image nach Docker Hub pushen
echo ""
echo "📤 Backend Image nach Docker Hub pushen..."
echo "Pushing: $BACKEND_IMAGE:$VERSION"
if ! docker push "$BACKEND_IMAGE:$VERSION"; then
    echo "❌ Backend Push fehlgeschlagen"
    exit 1
fi
echo "✅ Backend Image gepusht"

# Frontend Image nach Docker Hub pushen
echo ""
echo "📤 Frontend Image nach Docker Hub pushen..."
echo "Pushing: $FRONTEND_IMAGE:$VERSION"
if ! docker push "$FRONTEND_IMAGE:$VERSION"; then
    echo "❌ Frontend Push fehlgeschlagen"
    exit 1
fi
echo "✅ Frontend Image gepusht"

# Browser Extension Image nach Docker Hub pushen
echo ""
echo "📤 Browser Extension Image nach Docker Hub pushen..."
echo "Pushing: $BROWSER_EXT_IMAGE:$VERSION"
if ! docker push "$BROWSER_EXT_IMAGE:$VERSION"; then
    echo "❌ Browser Extension Push fehlgeschlagen"
    exit 1
fi
echo "✅ Browser Extension Image gepusht"

# Optional: Azure Container Apps aktualisieren
if command -v az >/dev/null 2>&1; then
    echo ""
    echo "🔄 Azure Container Apps aktualisieren? (y/n)"
    read -r response
    if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        echo "Azure Resource Group Name eingeben:"
        read -r RESOURCE_GROUP
        echo "Backend App Name eingeben (z.B. trustme-prod-backend):"
        read -r BACKEND_APP_NAME
        echo "Frontend App Name eingeben (z.B. trustme-prod-frontend):"
        read -r FRONTEND_APP_NAME
        
        echo "🔄 Backend Container App aktualisieren..."
        if az containerapp update \
            --name "$BACKEND_APP_NAME" \
            --resource-group "$RESOURCE_GROUP" \
            --image "$BACKEND_IMAGE:$VERSION"; then
            echo "✅ Backend Container App aktualisiert"
        else
            echo "⚠️  Backend Container App Update fehlgeschlagen"
        fi
        
        echo "🔄 Frontend Container App aktualisieren..."
        if az containerapp update \
            --name "$FRONTEND_APP_NAME" \
            --resource-group "$RESOURCE_GROUP" \
            --image "$FRONTEND_IMAGE:$VERSION"; then
            echo "✅ Frontend Container App aktualisiert"
        else
            echo "⚠️  Frontend Container App Update fehlgeschlagen"
        fi
    fi
else
    echo ""
    echo "ℹ️  Azure CLI nicht installiert - manuelle Container App Updates erforderlich"
    echo ""
    echo "📋 Manuelle Update-Kommandos:"
    echo "az containerapp update --name BACKEND_APP_NAME --resource-group RESOURCE_GROUP --image $BACKEND_IMAGE:$VERSION"
    echo "az containerapp update --name FRONTEND_APP_NAME --resource-group RESOURCE_GROUP --image $FRONTEND_IMAGE:$VERSION"
fi

echo ""
echo "🎉 Docker Hub Deployment abgeschlossen!"
echo ""
echo "📋 Zusammenfassung:"
echo "• Backend Image: $BACKEND_IMAGE:$VERSION"
echo "• Frontend Image: $FRONTEND_IMAGE:$VERSION"
echo "• Browser Extension Image: $BROWSER_EXT_IMAGE:$VERSION"
echo "• Alle Images sind auf Docker Hub verfügbar"
echo "• Azure Container Apps können jetzt die neuen Images verwenden"
echo ""
echo "🔗 Docker Hub URLs:"
echo "• https://hub.docker.com/r/$DOCKER_HUB_USERNAME/trustme-backend"
echo "• https://hub.docker.com/r/$DOCKER_HUB_USERNAME/trustme-frontend"
echo "• https://hub.docker.com/r/$DOCKER_HUB_USERNAME/trustme-browser-extension"