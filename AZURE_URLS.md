# TrustMe Password Manager - Schöne Azure URLs

## 🚀 Produktive URLs (Front Door + WAF)

Nach dem erfolgreichen Azure-Deployment findest du diese schönen, lesbaren URLs:

### Frontend (Web-App)
```
https://trustme-{6-zeichen}-app-{hash}.azurefd.net
```
- **Zweck**: Hauptanwendung für Benutzer
- **Features**: React-Frontend mit Vite
- **Sicherheit**: WAF-geschützt, HTTPS-erzwungen
- **Name**: `trustme-frontend-{6-zeichen}`

### Backend (API)
```
https://trustme-{6-zeichen}-api-{hash}.azurefd.net
```
- **Zweck**: REST API für Frontend und Browser Extension
- **Features**: Go Fiber Backend mit PostgreSQL
- **Sicherheit**: WAF-geschützt, Rate-Limiting
- **Name**: `trustme-backend-{6-zeichen}`

### E-Mail Testing (MailHog)
```
https://trustme-{6-zeichen}-mail-{hash}.azurefd.net
```
- **Zweck**: E-Mail-Testing während der Entwicklung
- **Features**: Web-basierter E-Mail-Client
- **Name**: `trustme-mailhog-{6-zeichen}`

## 🔧 Direkte Container URLs (ohne Front Door)

Falls du die direkten Container-URLs brauchst:

### Frontend
```
https://trustme-frontend-{6-zeichen}.{hash}.westeurope.azurecontainerapps.io
```

### Backend  
```
https://trustme-backend-{6-zeichen}.{hash}.westeurope.azurecontainerapps.io
```

### MailHog
```
https://trustme-mailhog-{6-zeichen}.{hash}.westeurope.azurecontainerapps.io
```

## 📍 Wo findest du die URLs?

### 1. Nach dem Deployment (Terminal)
```bash
azd up
# Zeigt am Ende:
# TRUSTME_APP_URL=https://trustme-xyz-app-abc.azurefd.net
# TRUSTME_API_URL=https://trustme-xyz-api-abc.azurefd.net  
# TRUSTME_MAIL_URL=https://trustme-xyz-mail-abc.azurefd.net
```

### 2. Azure Portal
- **Resource Group**: `rg-on-24-09-christoph`
- **Front Door Profile**: `trustme-fd-{6-zeichen}`
- **Container Apps**: `trustme-frontend-{6-zeichen}`, `trustme-backend-{6-zeichen}`, etc.
- **Key Vault**: `trustme-vault-{6-zeichen}`
- **Database**: `trustme-db-{6-zeichen}`

### 3. CLI Befehl
```bash
azd show
# Zeigt alle Deployment-Infos und URLs
```

## 🛡️ Sicherheitsfeatures

### Web Application Firewall (WAF)
- **Microsoft Default Rule Set 2.1**: Schutz vor OWASP Top 10
- **Bot Manager Rule Set 1.0**: Bot-Schutz  
- **Rate Limiting**: Max 100 Requests/Minute pro IP
- **Custom Rules**: Anpassbare Sicherheitsregeln

### HTTPS Enforcement
- **Auto-Redirect**: HTTP → HTTPS
- **TLS Termination**: An der Edge
- **SSL-Zertifikate**: Automatisch von Azure verwaltet

## 🌍 Global Performance

### Azure Front Door Vorteile
- **Global Edge Locations**: Niedrige Latenz weltweit
- **Intelligent Routing**: Automatisches Routing zur besten Region
- **Health Probes**: Automatisches Failover bei Problemen
- **Caching**: Statische Inhalte werden gecacht

### 🏷️ Neue Naming-Struktur

**Azure Resources:**
- Container Apps: `trustme-frontend-abc123`, `trustme-backend-abc123`
- Database: `trustme-db-abc123`  
- Key Vault: `trustme-vault-abc123`
- Front Door: `trustme-fd-abc123`
- Container Registry: `trustmeregistryabc123`

**Front Door URLs:**
```
https://trustme-abc123-{service}-{hash}.azurefd.net
```

- **trustme**: Projekt-Identifikator
- **abc123**: Kurzer 6-Zeichen eindeutiger String (statt langer Hash)
- **{service}**: app (Frontend), api (Backend), mail (MailHog)
- **{hash}**: Azure-generierter Hash für Eindeutigkeit

Beispiel: `https://trustme-abc123-app-def456.azurefd.net`