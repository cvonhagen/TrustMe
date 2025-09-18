#!/bin/bash

# TrustMe Vereinfachtes Azure Deployment mit azd
# Automatisiert das komplette Deployment zu Azure Container Apps

set -e

echo "🚀 TrustMe Azure Deployment mit azd"
echo "===================================="

# Prüfe ob azd installiert ist
if ! command -v azd &> /dev/null; then
    echo "❌ Azure Developer CLI (azd) ist nicht installiert"
    echo "Installation: winget install Microsoft.Azd"
    exit 1
fi

# Umgebungsvariablen setzen
echo "📋 Setze Umgebungsvariablen..."
azd env set AZURE_LOCATION "westeurope"
azd env set AZURE_ENV_NAME "trustme"

# Azure Login prüfen
echo "🔐 Prüfe Azure Login..."
if ! az account show &> /dev/null; then
    echo "⚠️ Azure Login erforderlich..."
    az login
fi

# Provisioning starten
echo "🏗️ Starte Azure Resource Provisioning..."
azd provision --no-prompt

# Docker Images bauen und deployen
echo "📦 Baue und deploye Docker Images..."
azd deploy --no-prompt

# Status anzeigen
echo "✅ Deployment Status..."
azd show

echo ""
echo "🎉 TrustMe erfolgreich zu Azure deployed!"
echo "Verwende 'azd show' um die URLs anzuzeigen"