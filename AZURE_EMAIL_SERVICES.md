# Azure Communication Services E-Mail Integration

## Übersicht
Das TrustMe System nutzt **Azure Communication Services** für E-Mail-Funktionen wie:
- 📧 Password-Reset E-Mails
- ✅ Account-Verifikation
- 🔔 Sicherheitswarnungen
- 📨 System-Benachrichtigungen

## 🏗️ Automatisches Deployment

### Via Quick Deploy Script
```bash
./quick-deploy-azure-dockerhub.sh
```

Das Script erstellt automatisch:
- **Azure Communication Services** - E-Mail Service
- **Azure Managed E-Mail Domain** - Kostenlose .onmicrosoft.com Domain  
- **Connection String** - Automatisch als Environment Variable gesetzt

### Was wird deployiert

#### 1. Azure Communication Services Resources
```json
{
  "emailServiceName": "trustme-prod-email-abc123",
  "communicationServiceName": "trustme-prod-acs-abc123",
  "emailDomain": "abc123.azurecomm.net"
}
```

#### 2. Backend Environment Variables
```bash
AZURE_COMMUNICATION_CONNECTION_STRING=endpoint=https://...;accesskey=...
EMAIL_FROM_ADDRESS=DoNotReply@abc123.azurecomm.net
```

## 📋 Manual Setup (Falls erforderlich)

### 1. Azure Portal Setup
1. Gehe zu **Azure Portal** → **Communication Services**
2. Erstelle neue **Communication Service**
3. Gehe zu **Email** → **Provision Domains**
4. Wähle **Azure Managed Domain** (kostenlos)
5. Kopiere **Connection String**

### 2. Backend Code Integration
Das Backend ist bereits vorbereitet für Azure Communication Services:

```go
// Beispiel Go Code (wird implementiert)
import "github.com/Azure/communication-email-go"

func SendPasswordResetEmail(toEmail, resetToken string) error {
    client := azureemail.NewClient(os.Getenv("AZURE_COMMUNICATION_CONNECTION_STRING"))
    
    message := &azureemail.EmailMessage{
        From: os.Getenv("EMAIL_FROM_ADDRESS"),
        To:   []string{toEmail},
        Subject: "TrustMe Password Reset",
        PlainText: fmt.Sprintf("Reset Token: %s", resetToken),
    }
    
    return client.Send(context.Background(), message)
}
```

## 🚀 Deployment Status

### ✅ Was ist bereits konfiguriert:
- [x] Azure Communication Services Resource
- [x] Azure Managed E-Mail Domain  
- [x] Connection String als Secret
- [x] Environment Variables im Backend
- [x] Automatisches Deployment via Scripts

### 🔄 Was noch implementiert werden muss:
- [ ] Go Backend E-Mail Service Implementation
- [ ] Password Reset E-Mail Templates
- [ ] Account Verifikation Flow
- [ ] E-Mail Rate Limiting
- [ ] E-Mail Logging & Monitoring

## 💰 Kosten

### Azure Communication Services Pricing
- **Azure Managed Domain**: **KOSTENLOS** (begrenzt auf .onmicrosoft.com)
- **E-Mail Versand**: **$0.25 pro 1000 E-Mails**
- **Erste 100 E-Mails/Monat**: **KOSTENLOS**

### Beispiel Kosten:
- 0-100 E-Mails/Monat: **€0,00**
- 1000 E-Mails/Monat: **~€0,23**
- 10000 E-Mails/Monat: **~€2,30**

## 🔧 Konfiguration

### Environment Variables (Automatisch gesetzt)
```bash
AZURE_COMMUNICATION_CONNECTION_STRING=endpoint=https://trustme-prod-acs-abc123.europe.communication.azure.com/;accesskey=xyz...
EMAIL_FROM_ADDRESS=DoNotReply@abc123.azurecomm.net
```

### Manuelle Konfiguration (Optional)
Für eigene Domain statt Azure Managed Domain:

1. **Eigene Domain hinzufügen**:
   ```bash
   az communication email domain create \
     --resource-group trustme-prod-rg \
     --email-service-name trustme-prod-email-abc123 \
     --domain-name example.com \
     --domain-management CustomerManaged
   ```

2. **DNS Records konfigurieren** (SPF, DKIM, DMARC)

## 📊 Monitoring

### Azure Portal Monitoring
- **Communication Services** → **Metrics** → **Email Operations**
- **Application Insights** für E-Mail Success/Failure Rates

### Logs checken
```bash
# Backend Container Logs
az containerapp logs show \
  --name trustme-prod-backend \
  --resource-group trustme-prod-rg \
  --follow

# Communication Services Logs  
az monitor activity-log list \
  --resource-group trustme-prod-rg \
  --resource-type Microsoft.Communication/communicationServices
```

## 🛠️ Troubleshooting

### Häufige Probleme

#### 1. E-Mail wird nicht versendet
```bash
# Check Connection String
az containerapp exec \
  --name trustme-prod-backend \
  --resource-group trustme-prod-rg \
  --command "printenv | grep AZURE_COMMUNICATION"
```

#### 2. "Domain not verified" Error
- Warte 5-10 Minuten nach Deployment
- Azure Managed Domains werden automatisch verifiziert

#### 3. Rate Limit erreicht
- Standard: 10 E-Mails/Minute, 100 E-Mails/Stunde
- Für höhere Limits: Azure Support Ticket

## 🔗 Nützliche Links

- [Azure Communication Services Docs](https://docs.microsoft.com/azure/communication-services/)
- [E-Mail SDK für Go](https://github.com/Azure/azure-sdk-for-go/tree/main/sdk/communication/azemail)
- [Pricing Calculator](https://azure.microsoft.com/pricing/details/communication-services/)
- [Service Limits](https://docs.microsoft.com/azure/communication-services/concepts/service-limits)

---

> **Note**: Die E-Mail-Integration ist jetzt in der Azure-Infrastruktur bereit. Backend-Code muss noch implementiert werden für tatsächliche E-Mail-Funktionen.