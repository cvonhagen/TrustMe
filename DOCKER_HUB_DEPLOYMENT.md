# Docker Hub Deployment für TrustMe

Mit der neuen Docker Hub Integration ist das Deployment viel einfacher geworden! 🐳

## 🎯 Workflow

1. **Code ändern** → Docker Images werden automatisch neu gebaut
2. **GitHub Push** → GitHub Action baut und pusht Images nach Docker Hub
3. **Azure zieht Images** → Container Apps verwenden die neuen Images automatisch

## 🔧 Setup

### 1. Docker Hub Account einrichten

```bash
# Docker Hub Account erstellen auf https://hub.docker.com
# Username: trustmepassword (oder deiner)
# Repositories erstellen:
# - trustmepassword/trustme-backend
# - trustmepassword/trustme-frontend
```

### 2. GitHub Secrets konfigurieren

Im GitHub Repository unter Settings → Secrets and Variables:

```
DOCKER_HUB_TOKEN = dein_docker_hub_access_token
```

### 3. Azure Container Apps deployen

Das neue Azure Portal Template nutzt Docker Hub:

```bash
# 1. Azure Portal öffnen
# 2. "Create a resource" → "Template deployment"
# 3. azure-portal-deployment.json hochladen
# 4. Parameter eingeben:
#    - dockerHubUsername: trustmepassword
#    - dbAdminPassword: sicheres_passwort
#    - jwtSecretKey: langer_sicherer_schlüssel
```

## 🚀 Manuelle Deployment-Optionen

### Option 1: Lokales Script (Bash)
```bash
./deploy-docker-hub.sh
# Baut Images lokal und pusht nach Docker Hub
```

### Option 2: Lokales Script (PowerShell)
```powershell
.\deploy-docker-hub.ps1
# Gleich wie Bash, aber für Windows
```

### Option 3: Automatisch via GitHub
```bash
git add .
git commit -m "feat: neue Argon2id Sicherheit"
git push origin main
# GitHub Action baut und pusht automatisch
```

## 🔄 Wie Azure die Images zieht

### Bei Erstellen der Container App:
```json
{
  "image": "trustmepassword/trustme-backend:latest"
}
```

### Bei Updates:
```bash
az containerapp update \
  --name trustme-prod-backend \
  --resource-group trustme-rg \
  --image trustmepassword/trustme-backend:latest
```

## 🏷️ Image Versioning

GitHub Action erstellt mehrere Tags:

- `latest` - Immer die neueste Version
- `main-a1b2c3d` - Branch + Commit Hash  
- `20241224-143022` - Zeitstempel

Azure nutzt standardmäßig `:latest`, kann aber auf spezifische Versionen geändert werden.

## 🔐 Sicherheit

### Vorteile Docker Hub vs. Azure Container Registry:

✅ **Einfacher**: Keine Registry-Authentifizierung nötig
✅ **Günstiger**: Docker Hub ist kostenlos für öffentliche Repos
✅ **Schneller**: Direkter Pull ohne Azure CLI Login
✅ **Flexibler**: Images können überall verwendet werden

⚠️ **Beachten**: Images sind öffentlich sichtbar (für private Repos Docker Hub Pro nötig)

## 📊 Monitoring

### Docker Hub:
- https://hub.docker.com/r/trustmepassword/trustme-backend
- https://hub.docker.com/r/trustmepassword/trustme-frontend

### GitHub Actions:
- Actions Tab im Repository zeigt Build-Status

### Azure Container Apps:
```bash
# Logs anzeigen
az containerapp logs show --name trustme-prod-backend --resource-group trustme-rg

# Status prüfen
az containerapp show --name trustme-prod-backend --resource-group trustme-rg
```

## 🎯 Nächste Schritte

1. **Azure Deployment**: Nutze das neue `azure-portal-deployment.json`
2. **GitHub Integration**: Push deinen Code für automatisches Deployment
3. **Docker Hub konfigurieren**: Erstelle Account und Repositories
4. **Testing**: Images lokal bauen und testen

**Das System ist jetzt 100% Docker Hub ready! 🎉**