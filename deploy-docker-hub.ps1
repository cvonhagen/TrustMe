# TrustMe Docker Hub Deployment Script (PowerShell)
# Baut Docker Images und pusht sie nach Docker Hub für Azure Container Apps

param(
    [string]$Version = "latest",
    [string]$DockerHubUsername = "christechstarter"  # Docker Hub Username für öffentliche Repos
)

$ErrorActionPreference = "Stop"

# Konfiguration
$BackendImage = "$DockerHubUsername/trustme-backend"
$FrontendImage = "$DockerHubUsername/trustme-frontend"
$BrowserExtImage = "$DockerHubUsername/trustme-browser-extension"

Write-Host "🔐 TrustMe Docker Hub Deployment" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host "Docker Hub Username: $DockerHubUsername" -ForegroundColor Yellow
Write-Host "Backend Image: ${BackendImage}:$Version" -ForegroundColor Yellow
Write-Host "Frontend Image: ${FrontendImage}:$Version" -ForegroundColor Yellow
Write-Host "Browser Extension Image: ${BrowserExtImage}:$Version" -ForegroundColor Yellow
Write-Host ""

# Prüfen ob Docker läuft
try {
    docker info | Out-Null
} catch {
    Write-Host "❌ Docker ist nicht gestartet oder nicht verfügbar" -ForegroundColor Red
    exit 1
}

# Docker Hub Login (für öffentliche Repos optional)
Write-Host "🔑 Docker Hub Login (optional für öffentliche Repos)..." -ForegroundColor Blue
try {
    # Für öffentliche Repos ist Login optional, aber empfohlen für höhere Pull-Limits
    $loginChoice = Read-Host "Docker Hub Login ausführen? (y/n) [Standard: n]"
    if ($loginChoice -match "^[yY]") {
        docker login
        if ($LASTEXITCODE -ne 0) { 
            Write-Host "⚠️  Docker Hub Login fehlgeschlagen, aber weitermachen für öffentliche Repos" -ForegroundColor Yellow
        }
    } else {
        Write-Host "ℹ️  Login übersprungen - nutze anonyme öffentliche Repo-Berechtigung" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️  Docker Hub Login übersprungen" -ForegroundColor Yellow
}

# Backend Docker Image bauen
Write-Host ""
Write-Host "🔨 Backend Docker Image bauen..." -ForegroundColor Blue
Write-Host "Building: ${BackendImage}:$Version" -ForegroundColor Yellow
try {
    docker build --target production -t "${BackendImage}:$Version" ./backend
    if ($LASTEXITCODE -ne 0) { throw "Build failed" }
    Write-Host "✅ Backend Image gebaut" -ForegroundColor Green
} catch {
    Write-Host "❌ Backend Build fehlgeschlagen" -ForegroundColor Red
    exit 1
}

# Frontend Docker Image bauen
Write-Host ""
Write-Host "🔨 Frontend Docker Image bauen..." -ForegroundColor Blue
Write-Host "Building: ${FrontendImage}:$Version" -ForegroundColor Yellow
try {
    docker build --target production -t "${FrontendImage}:$Version" ./frontend
    if ($LASTEXITCODE -ne 0) { throw "Build failed" }
    Write-Host "✅ Frontend Image gebaut" -ForegroundColor Green
} catch {
    Write-Host "❌ Frontend Build fehlgeschlagen" -ForegroundColor Red
    exit 1
}

# Browser Extension Docker Image bauen
Write-Host ""
Write-Host "🔨 Browser Extension Docker Image bauen..." -ForegroundColor Blue
Write-Host "Building: ${BrowserExtImage}:$Version" -ForegroundColor Yellow
try {
    docker build --target production -t "${BrowserExtImage}:$Version" ./browser-extension
    if ($LASTEXITCODE -ne 0) { throw "Build failed" }
    Write-Host "✅ Browser Extension Image gebaut" -ForegroundColor Green
} catch {
    Write-Host "❌ Browser Extension Build fehlgeschlagen" -ForegroundColor Red
    exit 1
}

# Backend Image nach Docker Hub pushen
Write-Host ""
Write-Host "📤 Backend Image nach Docker Hub pushen..." -ForegroundColor Blue
Write-Host "Pushing: ${BackendImage}:$Version" -ForegroundColor Yellow
try {
    docker push "${BackendImage}:$Version"
    if ($LASTEXITCODE -ne 0) { throw "Push failed" }
    Write-Host "✅ Backend Image gepusht" -ForegroundColor Green
} catch {
    Write-Host "❌ Backend Push fehlgeschlagen" -ForegroundColor Red
    exit 1
}

# Frontend Image nach Docker Hub pushen
Write-Host ""
Write-Host "📤 Frontend Image nach Docker Hub pushen..." -ForegroundColor Blue
Write-Host "Pushing: ${FrontendImage}:$Version" -ForegroundColor Yellow
try {
    docker push "${FrontendImage}:$Version"
    if ($LASTEXITCODE -ne 0) { throw "Push failed" }
    Write-Host "✅ Frontend Image gepusht" -ForegroundColor Green
} catch {
    Write-Host "❌ Frontend Push fehlgeschlagen" -ForegroundColor Red
    exit 1
}

# Browser Extension Image nach Docker Hub pushen
Write-Host ""
Write-Host "📤 Browser Extension Image nach Docker Hub pushen..." -ForegroundColor Blue
Write-Host "Pushing: ${BrowserExtImage}:$Version" -ForegroundColor Yellow
try {
    docker push "${BrowserExtImage}:$Version"
    if ($LASTEXITCODE -ne 0) { throw "Push failed" }
    Write-Host "✅ Browser Extension Image gepusht" -ForegroundColor Green
} catch {
    Write-Host "❌ Browser Extension Push fehlgeschlagen" -ForegroundColor Red
    exit 1
}

# Info: Azure Container Apps Updates
Write-Host ""
Write-Host "ℹ️  Azure Container App Updates müssen manuell durchgeführt werden" -ForegroundColor Yellow
Write-Host ""
Write-Host "📋 Manuelle Update-Kommandos:" -ForegroundColor Cyan
Write-Host "az containerapp update --name BACKEND_APP_NAME --resource-group RESOURCE_GROUP --image ${BackendImage}:$Version" -ForegroundColor White
Write-Host "az containerapp update --name FRONTEND_APP_NAME --resource-group RESOURCE_GROUP --image ${FrontendImage}:$Version" -ForegroundColor White
Write-Host ""
Write-Host "💡 Tipp: In der Azure Sandbox-Umgebung müssen Container App Updates über das Azure Portal erfolgen" -ForegroundColor Yellow

Write-Host ""
Write-Host "🎉 Docker Hub Deployment abgeschlossen!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Zusammenfassung:" -ForegroundColor Cyan
Write-Host "• Backend Image: ${BackendImage}:$Version" -ForegroundColor White
Write-Host "• Frontend Image: ${FrontendImage}:$Version" -ForegroundColor White
Write-Host "• Browser Extension Image: ${BrowserExtImage}:$Version" -ForegroundColor White
Write-Host "• Alle Images sind auf Docker Hub verfügbar" -ForegroundColor White
Write-Host "• Azure Container Apps können jetzt die neuen Images verwenden" -ForegroundColor White
Write-Host ""
Write-Host "🔗 Docker Hub URLs:" -ForegroundColor Cyan
Write-Host "• https://hub.docker.com/r/$DockerHubUsername/trustme-backend" -ForegroundColor Blue
Write-Host "• https://hub.docker.com/r/$DockerHubUsername/trustme-frontend" -ForegroundColor Blue
Write-Host "• https://hub.docker.com/r/$DockerHubUsername/trustme-browser-extension" -ForegroundColor Blue