# TrustMe Password Manager - Azure URLs

## 🚀 Produktive URLs (Front Door + WAF)

Nach dem erfolgreichen Azure-Deployment findest du diese schönen URLs:

### Frontend (Web-App)
```
https://trustme-{uniquestring}-app-{hash}.azurefd.net
```
- **Zweck**: Hauptanwendung für Benutzer
- **Features**: React-Frontend mit Vite
- **Sicherheit**: WAF-geschützt, HTTPS-erzwungen

### Backend (API)
```
https://trustme-{uniquestring}-api-{hash}.azurefd.net
```
- **Zweck**: REST API für Frontend und Browser Extension
- **Features**: Go Fiber Backend mit PostgreSQL
- **Sicherheit**: WAF-geschützt, Rate-Limiting

### E-Mail Testing (MailHog)
```
https://trustme-{uniquestring}-mail-{hash}.azurefd.net
```
- **Zweck**: E-Mail-Testing während der Entwicklung
- **Features**: Web-basierter E-Mail-Client
- **Zugriff**: Nur für Development/Testing

## 🔧 Direkte Container URLs (ohne Front Door)

Falls du die direkten Container-URLs brauchst:

### Frontend
```
https://ca-frontend-{uniquestring}.{hash}.westeurope.azurecontainerapps.io
```

### Backend  
```
https://ca-backend-{uniquestring}.{hash}.westeurope.azurecontainerapps.io
```

### MailHog
```
https://ca-mailhog-{uniquestring}.{hash}.westeurope.azurecontainerapps.io
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
- **Front Door Profile**: `fd-{uniquestring}`
- **Endpoints**: Unter "Front Door Endpoints"

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

## 📝 URL-Naming Schema

```
https://trustme-{uniquestring}-{service}-{hash}.azurefd.net
```

- **trustme**: Projekt-Identifikator
- **{uniquestring}**: Eindeutiger String basierend auf Resource Group
- **{service}**: app (Frontend), api (Backend), mail (MailHog)
- **{hash}**: Azure-generierter Hash für eindeutigkeit

Beispiel: `https://trustme-muwnkh33j26ko-app-abc123.azurefd.net`