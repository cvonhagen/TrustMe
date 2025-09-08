# TrustMe Password Manager - Deployment Guide

Komplette Anleitung für das Deployment von TrustMe auf Azure Container Apps und lokale Docker-Entwicklung.

## 📋 Inhaltsverzeichnis

- [Voraussetzungen](#voraussetzungen)
- [Lokale Entwicklung mit Docker](#lokale-entwicklung-mit-docker)
- [Azure Deployment](#azure-deployment)
- [CI/CD Pipeline](#cicd-pipeline)
- [Troubleshooting](#troubleshooting)
- [Sicherheitshinweise](#sicherheitshinweise)

---

## 🛠️ Voraussetzungen

### Erforderliche Software

1. **Docker Desktop**
   ```bash
   # Download von: https://www.docker.com/products/docker-desktop
   # Nach Installation prüfen:
   docker --version
   docker-compose --version
   ```

2. **Azure CLI**
   ```bash
   # Download von: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli
   # Nach Installation prüfen:
   az --version
   az login
   ```

3. **Git**
   ```bash
   git --version
   ```

4. **OpenSSL** (für SSL-Zertifikate)
   ```bash
   # Windows: Git Bash oder WSL verwenden
   # macOS: brew install openssl
   # Linux: sudo apt-get install openssl
   openssl version
   ```

### Azure Account Setup

1. **Azure Subscription** mit ausreichenden Berechtigungen
2. **Resource Group Contributor** Rolle minimum
3. **Container Registry** Zugriff

---

## 🐳 Lokale Entwicklung mit Docker

### Schritt 1: Repository klonen

```bash
git clone <repository-url>
cd TrustMe
```

### Schritt 2: Environment-Dateien konfigurieren

```bash
# Kopiere das Template
cp .env.example .env

# Bearbeite die .env Datei mit deinen lokalen Einstellungen
# Die .env.development Datei ist bereits für Docker Compose konfiguriert
```

### Schritt 3: SSL-Zertifikate generieren (für HTTPS)

```bash
# Script ausführbar machen
chmod +x scripts/generate-ssl-certs.sh

# SSL-Zertifikate erstellen
./scripts/generate-ssl-certs.sh
```

**Wichtig:** Füge `127.0.0.1 trustme.local` zu deiner Hosts-Datei hinzu:
- **Windows:** `C:\Windows\System32\drivers\etc\hosts`
- **macOS/Linux:** `/etc/hosts`

### Schritt 4: Development Environment starten

```bash
# Alle Services starten
docker-compose up -d

# Logs verfolgen
docker-compose logs -f

# Nur bestimmte Services starten
docker-compose up -d db backend frontend
```

### Schritt 5: Services testen

```bash
# Backend Health Check
curl http://localhost:3030/health

# Frontend öffnen
open http://localhost:3000

# MailHog (E-Mail Testing) öffnen
open http://localhost:8025
```

### Schritt 6: Production-ähnliches Setup testen

```bash
# Production Docker Compose verwenden
docker-compose -f docker-compose.prod.yml up -d

# Mit SSL öffnen (nach SSL-Setup)
open https://trustme.local
```

---

## ☁️ Azure Deployment

### Schritt 1: Azure Ressourcen erstellen (Einmalig)

```bash
# Script ausführbar machen
chmod +x scripts/setup-azure-resources.sh

# Azure Ressourcen erstellen
./scripts/setup-azure-resources.sh

# Bei Problemen: Cleanup
./scripts/setup-azure-resources.sh --cleanup
```

**Das Script erstellt:**
- Resource Groups (staging & production)
- Container Registries
- Key Vaults
- PostgreSQL Flexible Servers
- Log Analytics Workspaces
- Container Apps Environments
- Service Principal für GitHub Actions

### Schritt 2: GitHub Repository Secrets konfigurieren

Nach dem Setup-Script werden Dateien erstellt mit den notwendigen Credentials:

1. **GitHub Repository Settings** → **Secrets and variables** → **Actions**

2. **Füge folgende Secrets hinzu:**

   ```
   AZURE_CREDENTIALS
   # Inhalt aus: .azure-github-credentials.json
   
   DB_ADMIN_PASSWORD
   # Inhalt aus: .azure-db-prod.txt (Password Zeile)
   
   JWT_SECRET_KEY
   # Generiere mit: openssl rand -base64 32
   ```

### Schritt 3: Manuelles Deployment

```bash
# Script ausführbar machen
chmod +x deploy-azure.sh

# Production Deployment
./deploy-azure.sh

# Cleanup (Vorsicht!)
./deploy-azure.sh --cleanup
```

### Schritt 4: Deployment Status prüfen

```bash
# Container Apps Status
az containerapp list --resource-group trustme-prod-rg --output table

# Logs anzeigen
az containerapp logs show \
  --name trustme-prod-backend \
  --resource-group trustme-prod-rg \
  --follow

# URLs abrufen
az containerapp show \
  --name trustme-prod-frontend \
  --resource-group trustme-prod-rg \
  --query properties.configuration.ingress.fqdn
```

---

## 🔄 CI/CD Pipeline

### Automatisches Deployment

Die GitHub Actions Pipeline ist bereits konfiguriert:

- **Push auf `develop`** → Deployment zu **Staging**
- **Push auf `main`** → Deployment zu **Production**
- **Manual Trigger** → Wählbares Environment

### Pipeline Features

- ✅ Docker Multi-Stage Builds
- ✅ Security Scanning (Trivy)
- ✅ Automatische Health Checks
- ✅ Rollback bei Fehlern
- ✅ Environment-spezifische Deployments

### Manual Deployment Trigger

1. GitHub Repository → **Actions**
2. **Azure Container Apps Deployment** workflow
3. **Run workflow** → Environment auswählen

---

## 🔧 Konfiguration & Customization

### Environment Variables

| Variable | Development | Production | Beschreibung |
|----------|-------------|------------|--------------|
| `DATABASE_URL` | Docker Compose | Azure PostgreSQL | Datenbank-Verbindung |
| `JWT_SECRET_KEY` | Einfach | Stark (32+ Zeichen) | JWT Token Signierung |
| `ALLOWED_ORIGINS` | localhost | Deine Domain | CORS Konfiguration |
| `VITE_BACKEND_URL` | localhost:3030 | Azure Container App | Frontend → Backend |

### Custom Domain (Optional)

1. **DNS CNAME** zu Azure Container App URL
2. **Custom Domain** in Azure Container App konfigurieren
3. **SSL-Zertifikat** über Azure verwalten lassen

### Scaling Konfiguration

```bash
# Auto-Scaling anpassen
az containerapp update \
  --name trustme-prod-backend \
  --resource-group trustme-prod-rg \
  --min-replicas 2 \
  --max-replicas 10
```

---

## 🚨 Troubleshooting

### Häufige Probleme

#### 1. Docker Build Fehler

```bash
# Cache löschen
docker system prune -a

# Einzelne Images neu bauen
docker-compose build --no-cache backend frontend
```

#### 2. Azure Login Probleme

```bash
# Neu anmelden
az logout
az login

# Subscription prüfen
az account list --output table
az account set --subscription "Your-Subscription-ID"
```

#### 3. Container App Deployment Fehler

```bash
# Logs prüfen
az containerapp logs show \
  --name trustme-prod-backend \
  --resource-group trustme-prod-rg \
  --follow

# Revision History
az containerapp revision list \
  --name trustme-prod-backend \
  --resource-group trustme-prod-rg \
  --output table
```

#### 4. Database Connection Issues

```bash
# PostgreSQL Firewall prüfen
az postgres flexible-server firewall-rule list \
  --resource-group trustme-prod-rg \
  --name trustme-prod-db

# Connection String testen
psql "postgresql://user:pass@server:5432/trustme?sslmode=require"
```

#### 5. SSL/TLS Probleme

```bash
# Zertifikat neu generieren
rm -rf nginx/ssl/*
./scripts/generate-ssl-certs.sh

# Browser Cache löschen
# Chrome: chrome://settings/clearBrowserData
```

### Debug Commands

```bash
# Container Status
docker-compose ps

# Service Logs
docker-compose logs backend
docker-compose logs frontend
docker-compose logs db

# Container Shell
docker-compose exec backend sh
docker-compose exec frontend sh

# Database Shell
docker-compose exec db psql -U trustme_user -d trustme
```

---

## 🔒 Sicherheitshinweise

### Production Checklist

- [ ] **Starke Passwörter** für alle Services
- [ ] **JWT Secret** mindestens 32 Zeichen
- [ ] **HTTPS** für alle Verbindungen
- [ ] **CORS** nur für erlaubte Domains
- [ ] **Rate Limiting** aktiviert
- [ ] **Security Headers** konfiguriert
- [ ] **Database Firewall** nur für Azure Services
- [ ] **Container Images** regelmäßig updaten
- [ ] **Secrets** in Azure Key Vault
- [ ] **Monitoring** und **Alerting** einrichten

### Secrets Management

```bash
# Secrets in Azure Key Vault speichern
az keyvault secret set \
  --vault-name trustme-prod-kv-xxx \
  --name jwt-secret \
  --value "your-jwt-secret"

# Secrets aus Key Vault abrufen
az keyvault secret show \
  --vault-name trustme-prod-kv-xxx \
  --name jwt-secret \
  --query value -o tsv
```

### Backup Strategy

```bash
# Database Backup
az postgres flexible-server backup list \
  --resource-group trustme-prod-rg \
  --name trustme-prod-db

# Container Registry Backup
az acr repository list --name trustmeregistryprod
```

---

## 📊 Monitoring & Logging

### Azure Monitor

```bash
# Log Analytics Queries
az monitor log-analytics query \
  --workspace "trustme-prod-logs" \
  --analytics-query "ContainerAppConsoleLogs_CL | limit 100"
```

### Health Endpoints

- **Backend:** `https://your-backend-url/health`
- **Frontend:** `https://your-frontend-url/`
- **Database:** Connection Test via Backend

### Performance Monitoring

- **Application Insights** für detaillierte Metriken
- **Container Apps Metrics** für Resource Usage
- **PostgreSQL Insights** für Database Performance

---

## 🆘 Support & Wartung

### Regelmäßige Aufgaben

1. **Security Updates** (monatlich)
2. **Dependency Updates** (wöchentlich)
3. **Backup Verification** (wöchentlich)
4. **Performance Review** (monatlich)
5. **Cost Optimization** (monatlich)

### Kontakt & Dokumentation

- **Azure Dokumentation:** [Container Apps Docs](https://docs.microsoft.com/en-us/azure/container-apps/)
- **Docker Dokumentation:** [Docker Compose](https://docs.docker.com/compose/)
- **PostgreSQL:** [Flexible Server Docs](https://docs.microsoft.com/en-us/azure/postgresql/flexible-server/)

---

## 📝 Changelog

| Version | Datum | Änderungen |
|---------|-------|------------|
| 1.0.0 | 2025-01-08 | Initial Deployment Setup |
| 1.1.0 | TBD | Custom Domain Support |
| 1.2.0 | TBD | Advanced Monitoring |

---

**🎉 Viel Erfolg mit deinem TrustMe Password Manager Deployment!**

Bei Fragen oder Problemen, prüfe zuerst die Troubleshooting-Sektion oder erstelle ein Issue im Repository.
