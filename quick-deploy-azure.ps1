.\quick-deploy-azure.ps1# TrustMe Azure Deployment - PowerShell Version
# Für Windows-Systeme mit Azure CLI-Problemen

Write-Host "🚀 TrustMe Azure Deployment (PowerShell)" -ForegroundColor Blue
Write-Host "=====================================" -ForegroundColor Blue

# Konfiguration
$APP_NAME = "trustme"
$ENVIRONMENT = "prod"
$LOCATION = "West Europe"
$RESOURCE_GROUP = "$APP_NAME-$ENVIRONMENT-rg"
$REGISTRY_NAME = "$APP_NAME" + "registry" + (Get-Random -Maximum 9999)

Write-Host "📋 Deployment-Konfiguration:" -ForegroundColor Yellow
Write-Host "App Name: $APP_NAME"
Write-Host "Environment: $ENVIRONMENT"
Write-Host "Location: $LOCATION"
Write-Host "Resource Group: $RESOURCE_GROUP"
Write-Host "Registry: $REGISTRY_NAME"
Write-Host ""

# Prüfe Prerequisites
Write-Host "🔍 Prüfe Prerequisites..." -ForegroundColor Cyan

# Prüfe Docker
try {
    docker --version | Out-Null
    if (!(docker info 2>$null)) {
        throw "Docker läuft nicht"
    }
    Write-Host "✅ Docker OK" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker Problem: $_" -ForegroundColor Red
    Write-Host "Bitte starte Docker Desktop und versuche es erneut." -ForegroundColor Yellow
    exit 1
}

# Prüfe Azure CLI
try {
    az --version | Out-Null
    Write-Host "✅ Azure CLI OK" -ForegroundColor Green
} catch {
    Write-Host "❌ Azure CLI Problem!" -ForegroundColor Red
    Write-Host ""
    Write-Host "LÖSUNGSANSÄTZE:" -ForegroundColor Yellow
    Write-Host "1. Azure CLI neu installieren: winget install Microsoft.AzureCLI"
    Write-Host "2. MSI-Installer verwenden: https://aka.ms/installazurecliwindows"
    Write-Host "3. Azure Cloud Shell verwenden: https://shell.azure.com"
    Write-Host ""
    exit 1
}

# Azure Login prüfen
Write-Host "🔐 Prüfe Azure Login..." -ForegroundColor Cyan
try {
    $account = az account show --query name -o tsv 2>$null
    if (!$account) {
        Write-Host "⚠️ Azure Login erforderlich..." -ForegroundColor Yellow
        az login
        $account = az account show --query name -o tsv
    }
    Write-Host "✅ Angemeldet als: $account" -ForegroundColor Green
} catch {
    Write-Host "❌ Azure Login fehlgeschlagen: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🎯 Bereit für Deployment!" -ForegroundColor Green
Write-Host ""
Write-Host "NÄCHSTE SCHRITTE:" -ForegroundColor Yellow
Write-Host "1. Führe das Bash-Skript aus: bash quick-deploy-azure.sh"
Write-Host "2. Oder verwende Azure Cloud Shell für vollständiges Deployment"
Write-Host "3. Bei weiteren Problemen: https://shell.azure.com verwenden"
Write-Host ""

# Sammle Informationen für manuelles Deployment
Write-Host "📝 MANUELLE DEPLOYMENT-BEFEHLE:" -ForegroundColor Cyan
Write-Host ""
Write-Host "# Resource Group erstellen"
Write-Host "az group create --name $RESOURCE_GROUP --location '$LOCATION'"
Write-Host ""
Write-Host "# Container Registry erstellen"
Write-Host "az acr create --resource-group $RESOURCE_GROUP --name $REGISTRY_NAME --sku Basic --admin-enabled true"
Write-Host ""
Write-Host "# Registry Login"
Write-Host "az acr login --name $REGISTRY_NAME"
Write-Host ""
Write-Host "# Images bauen und pushen"
Write-Host "docker build -t $REGISTRY_NAME.azurecr.io/trustme/backend:latest --target production --file .\backend\Dockerfile .\backend\"
Write-Host "docker build -t $REGISTRY_NAME.azurecr.io/trustme/frontend:latest --target production --file .\frontend\Dockerfile .\frontend\"
Write-Host "docker push $REGISTRY_NAME.azurecr.io/trustme/backend:latest"
Write-Host "docker push $REGISTRY_NAME.azurecr.io/trustme/frontend:latest"
Write-Host ""