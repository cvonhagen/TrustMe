# azure-push.ps1 - Automatisches Deployment für Azure Sandbox
# Baut Docker Images, pusht sie nach Docker Hub und updated Azure Container Apps

param(
    [string]$ResourceGroup = $(Read-Host "Azure Resource Group Name eingeben"),
    [string]$BackendAppName = $(Read-Host "Backend App Name eingeben (z.B. trustme-prod-backend)"),
    [string]$FrontendAppName = $(Read-Host "Frontend App Name eingeben (z.B. trustme-prod-frontend)"),
    [string]$Version = "latest"
)

$ErrorActionPreference = "Stop"

Write-Host "🚀 Azure Sandbox Deployment Automation" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "Resource Group: $ResourceGroup" -ForegroundColor Yellow
Write-Host "Backend App: $BackendAppName" -ForegroundColor Yellow  
Write-Host "Frontend App: $FrontendAppName" -ForegroundColor Yellow
Write-Host "Version: $Version" -ForegroundColor Yellow
Write-Host ""

# Prüfen ob Docker läuft
try {
    Write-Host "🐳 Prüfe Docker..." -ForegroundColor Blue
    docker info | Out-Null
    Write-Host "✅ Docker ist verfügbar" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker ist nicht gestartet oder nicht verfügbar" -ForegroundColor Red
    exit 1
}

# Prüfen ob Azure CLI installiert ist
try {
    Write-Host "☁️  Prüfe Azure CLI..." -ForegroundColor Blue
    az --version | Out-Null
    Write-Host "✅ Azure CLI ist installiert" -ForegroundColor Green
} catch {
    Write-Host "❌ Azure CLI ist nicht installiert" -ForegroundColor Red
    exit 1
}

# Prüfen ob eingeloggt in Azure
try {
    Write-Host "🔐 Prüfe Azure Login..." -ForegroundColor Blue
    # In Sandbox-Umgebung azd auth login verwenden
    $azdCheck = azd auth login --check 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Azure Developer CLI Login aktiv" -ForegroundColor Green
    } else {
        throw "Azure Developer CLI nicht authentifiziert"
    }
} catch {
    Write-Host "⚠️  Azure Developer CLI Login erforderlich" -ForegroundColor Yellow
    Write-Host "Öffne den Link in deinem Browser und folge den Anweisungen:" -ForegroundColor Yellow
    azd auth login --use-device-code --tenant-id 4dfdfd67-3a37-4e2e-b9f0-434c7061ba33
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Azure Developer CLI Login fehlgeschlagen" -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ Azure Developer CLI Login erfolgreich" -ForegroundColor Green
}

Write-Host ""
Write-Host "📦 Schritt 1: Docker Images bauen und pushen" -ForegroundColor Cyan
Write-Host "===========================================" -ForegroundColor Cyan

# Docker Hub Login (optional für höhere Pull-Limits)
Write-Host "🔑 Docker Hub Login (optional)..." -ForegroundColor Blue
try {
    $loginChoice = Read-Host "Docker Hub Login ausführen? (y/n) [Standard: n]"
    if ($loginChoice -match "^[yY]") {
        docker login
        if ($LASTEXITCODE -ne 0) { 
            Write-Host "⚠️  Docker Hub Login fehlgeschlagen" -ForegroundColor Yellow
        } else {
            Write-Host "✅ Docker Hub Login erfolgreich" -ForegroundColor Green
        }
    } else {
        Write-Host "ℹ️  Login übersprungen" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️  Docker Hub Login übersprungen" -ForegroundColor Yellow
}

# Docker Images bauen und pushen über vorhandenes Script
Write-Host "🔨 Führe Docker Hub Deployment aus..." -ForegroundColor Blue
try {
    & ".\deploy-docker-hub.ps1" -Version $Version
    if ($LASTEXITCODE -ne 0) {
        throw "Docker Hub Deployment fehlgeschlagen"
    }
    Write-Host "✅ Docker Images erfolgreich gebaut und gepusht" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker Images Build/Push fehlgeschlagen: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🔄 Schritt 2: Azure Container Apps aktualisieren" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan

Write-Host "ℹ️  Azure Container App Updates müssen manuell durchgeführt werden" -ForegroundColor Yellow
Write-Host ""
Write-Host "📋 Manuelle Update-Kommandos:" -ForegroundColor Cyan
Write-Host "az containerapp update --name $BackendAppName --resource-group $ResourceGroup --image christechstarter/trustme-backend:$Version" -ForegroundColor White
Write-Host "az containerapp update --name $FrontendAppName --resource-group $ResourceGroup --image christechstarter/trustme-frontend:$Version" -ForegroundColor White
Write-Host ""
Write-Host "💡 Tipp: In der Azure Sandbox-Umgebung müssen Container App Updates über das Azure Portal erfolgen" -ForegroundColor Yellow

Write-Host ""
Write-Host "📋 Schritt 3: Deployment Zusammenfassung" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan

Write-Host "✅ Deployment erfolgreich abgeschlossen!" -ForegroundColor Green
Write-Host ""
Write-Host "📦 Verwendete Images:" -ForegroundColor Cyan
Write-Host "   Backend:  christechstarter/trustme-backend:$Version" -ForegroundColor White
Write-Host "   Frontend: christechstarter/trustme-frontend:$Version" -ForegroundColor White
Write-Host ""
Write-Host "🔧 Nächste Schritte:" -ForegroundColor Cyan
Write-Host "   • Änderungen committen: git add . && git commit -m 'update'" -ForegroundColor White
Write-Host "   • Änderungen pushen:    git push" -ForegroundColor White
Write-Host "   • Container Apps manuell im Azure Portal aktualisieren" -ForegroundColor White
Write-Host ""
Write-Host "🎉 Azure Sandbox Deployment abgeschlossen!" -ForegroundColor Green

# Optional: GitHub Push
Write-Host ""
$gitChoice = Read-Host "Git Changes committen und pushen? (y/n) [Standard: n]"
if ($gitChoice -match "^[yY]") {
    try {
        Write-Host "📤 Git Push wird ausgeführt..." -ForegroundColor Blue
        git add .
        git commit -m "Azure Deployment Update - $(Get-Date)"
        git push
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Git Push erfolgreich" -ForegroundColor Green
        } else {
            Write-Host "⚠️  Git Push fehlgeschlagen" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "⚠️  Git Push fehlgeschlagen: $_" -ForegroundColor Yellow
    }
}