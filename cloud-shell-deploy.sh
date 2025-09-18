#!/bin/bash

# TrustMe Azure Deployment - Cloud Shell Version
# Für die Verwendung in der Azure Cloud Shell: https://shell.azure.com

set -e

echo "🚀 TrustMe Azure Deployment (Cloud Shell)"
echo "=========================================="

# Konfiguration
APP_NAME="trustme"
ENVIRONMENT="prod"
LOCATION="West Europe"
RESOURCE_GROUP="${APP_NAME}-${ENVIRONMENT}-rg"
REGISTRY_NAME="${APP_NAME}registry$(openssl rand -hex 4)"

echo "📋 Deployment-Konfiguration:"
echo "App Name: $APP_NAME"
echo "Environment: $ENVIRONMENT"
echo "Location: $LOCATION"
echo "Resource Group: $RESOURCE_GROUP"
echo "Registry: $REGISTRY_NAME"
echo ""

# Repository klonen (falls nicht vorhanden)
if [ ! -d "TrustMe" ]; then
    echo "📥 Klone Repository..."
    git clone https://github.com/dein-username/TrustMe.git
    cd TrustMe
else
    cd TrustMe
    git pull
fi

# Resource Group erstellen
echo "🏗️ Erstelle Resource Group..."
az group create \
    --name "$RESOURCE_GROUP" \
    --location "$LOCATION"

# Container Registry erstellen
echo "📦 Erstelle Container Registry..."
az acr create \
    --resource-group "$RESOURCE_GROUP" \
    --name "$REGISTRY_NAME" \
    --sku Basic \
    --admin-enabled true

# ACR Login
echo "🔐 Login zur Container Registry..."
az acr login --name "$REGISTRY_NAME"

# Docker Images bauen (in Cloud Shell mit ACR Build)
echo "🔨 Baue Backend Image..."
az acr build \
    --registry "$REGISTRY_NAME" \
    --image "trustme/backend:latest" \
    --file "./backend/Dockerfile" \
    "./backend/"

echo "🔨 Baue Frontend Image..."
az acr build \
    --registry "$REGISTRY_NAME" \
    --image "trustme/frontend:latest" \
    --file "./frontend/Dockerfile" \
    "./frontend/"

# Container Apps Environment erstellen
echo "🌐 Erstelle Container Apps Environment..."
ENVIRONMENT_NAME="${APP_NAME}-${ENVIRONMENT}-env"
az containerapp env create \
    --name "$ENVIRONMENT_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --location "$LOCATION"

# PostgreSQL Datenbank erstellen
echo "🗄️ Erstelle PostgreSQL Datenbank..."
DB_SERVER="${APP_NAME}-${ENVIRONMENT}-db"
DB_PASSWORD=$(openssl rand -base64 24 | tr -d "=+/" | cut -c1-16)

az postgres flexible-server create \
    --resource-group "$RESOURCE_GROUP" \
    --name "$DB_SERVER" \
    --location "$LOCATION" \
    --admin-user "trustmeadmin" \
    --admin-password "$DB_PASSWORD" \
    --sku-name "Standard_B1ms" \
    --tier "Burstable" \
    --storage-size 32 \
    --version 15

# Datenbank erstellen
az postgres flexible-server db create \
    --resource-group "$RESOURCE_GROUP" \
    --server-name "$DB_SERVER" \
    --database-name "trustme"

# Firewall Regel für Azure Services
az postgres flexible-server firewall-rule create \
    --resource-group "$RESOURCE_GROUP" \
    --name "$DB_SERVER" \
    --rule-name "AllowAzureServices" \
    --start-ip-address "0.0.0.0" \
    --end-ip-address "0.0.0.0"

# JWT Secret generieren
JWT_SECRET=$(openssl rand -base64 32)

# Backend Container App
echo "🚀 Deploye Backend..."
az containerapp create \
    --name "${APP_NAME}-${ENVIRONMENT}-backend" \
    --resource-group "$RESOURCE_GROUP" \
    --environment "$ENVIRONMENT_NAME" \
    --image "${REGISTRY_NAME}.azurecr.io/trustme/backend:latest" \
    --target-port 8080 \
    --ingress external \
    --registry-server "${REGISTRY_NAME}.azurecr.io" \
    --registry-username "$REGISTRY_NAME" \
    --registry-password "$(az acr credential show --name $REGISTRY_NAME --query passwords[0].value -o tsv)" \
    --env-vars \
        PORT=8080 \
        DB_HOST="${DB_SERVER}.postgres.database.azure.com" \
        DB_PORT=5432 \
        DB_NAME=trustme \
        DB_USER=trustmeadmin \
        DB_PASSWORD="$DB_PASSWORD" \
        JWT_SECRET="$JWT_SECRET" \
        ENVIRONMENT=production \
    --cpu 0.5 \
    --memory 1Gi \
    --min-replicas 1 \
    --max-replicas 3

# Backend URL abrufen
BACKEND_URL=$(az containerapp show \
    --name "${APP_NAME}-${ENVIRONMENT}-backend" \
    --resource-group "$RESOURCE_GROUP" \
    --query properties.configuration.ingress.fqdn \
    -o tsv)

# Frontend Container App
echo "🌐 Deploye Frontend..."
az containerapp create \
    --name "${APP_NAME}-${ENVIRONMENT}-frontend" \
    --resource-group "$RESOURCE_GROUP" \
    --environment "$ENVIRONMENT_NAME" \
    --image "${REGISTRY_NAME}.azurecr.io/trustme/frontend:latest" \
    --target-port 80 \
    --ingress external \
    --registry-server "${REGISTRY_NAME}.azurecr.io" \
    --registry-username "$REGISTRY_NAME" \
    --registry-password "$(az acr credential show --name $REGISTRY_NAME --query passwords[0].value -o tsv)" \
    --env-vars \
        VITE_BACKEND_URL="https://${BACKEND_URL}/api/v1" \
    --cpu 0.25 \
    --memory 0.5Gi \
    --min-replicas 1 \
    --max-replicas 2

# Frontend URL abrufen
FRONTEND_URL=$(az containerapp show \
    --name "${APP_NAME}-${ENVIRONMENT}-frontend" \
    --resource-group "$RESOURCE_GROUP" \
    --query properties.configuration.ingress.fqdn \
    -o tsv)

echo ""
echo "🎉 DEPLOYMENT ERFOLGREICH! 🎉"
echo "================================"
echo "Frontend URL: https://$FRONTEND_URL"
echo "Backend URL: https://$BACKEND_URL"
echo "Container Registry: $REGISTRY_NAME.azurecr.io"
echo "Database Server: $DB_SERVER.postgres.database.azure.com"
echo ""
echo "📝 WICHTIGE INFORMATIONEN:"
echo "DB Password: $DB_PASSWORD"
echo "JWT Secret: $JWT_SECRET"
echo ""
echo "💡 Nächste Schritte:"
echo "1. Öffne https://$FRONTEND_URL in deinem Browser"
echo "2. Registriere einen neuen Account"
echo "3. Teste die Browser-Extension mit der Backend-URL"