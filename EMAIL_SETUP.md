# E-Mail-Verifizierung Setup für TrustMe

## Übersicht

TrustMe unterstützt jetzt E-Mail-Verifizierung für neue Benutzerregistrierungen. Benutzer müssen ihre E-Mail-Adresse bestätigen, bevor sie sich anmelden können.

## Umgebungsvariablen

Fügen Sie die folgenden Umgebungsvariablen zu Ihrer `.env`-Datei hinzu:

```env
# E-Mail-Server Konfiguration
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_USER=
SMTP_PASS=
FROM_EMAIL=noreply@trustme.local
BASE_URL=http://localhost:5173

# Für Produktionsumgebung mit echtem SMTP-Server:
# SMTP_HOST=smtp.gmail.com
# SMTP_PORT=587
# SMTP_USER=your-email@gmail.com
# SMTP_PASS=your-app-password
# FROM_EMAIL=noreply@yourdomain.com
# BASE_URL=https://yourdomain.com
```

### Variablen-Beschreibung

- **SMTP_HOST**: SMTP-Server-Adresse (Standard: localhost für lokale Entwicklung)
- **SMTP_PORT**: SMTP-Server-Port (Standard: 1025 für MailHog)
- **SMTP_USER**: SMTP-Benutzername (leer für lokale Entwicklung ohne Auth)
- **SMTP_PASS**: SMTP-Passwort (leer für lokale Entwicklung ohne Auth)
- **FROM_EMAIL**: Absender-E-Mail-Adresse für Verifizierungs-E-Mails
- **BASE_URL**: Basis-URL der Frontend-Anwendung für Verifizierungslinks

## Lokaler E-Mail-Server Setup (MailHog)

Für die lokale Entwicklung empfehlen wir MailHog - einen einfachen SMTP-Server mit Web-Interface.

### Installation

#### Option 1: Mit Go (empfohlen)
```bash
go install github.com/mailhog/MailHog@latest
```

#### Option 2: Mit Docker
```bash
docker run -d -p 1025:1025 -p 8025:8025 mailhog/mailhog
```

#### Option 3: Binärdatei herunterladen
1. Gehen Sie zu: https://github.com/mailhog/MailHog/releases
2. Laden Sie die entsprechende Binärdatei für Ihr System herunter
3. Führen Sie die Datei aus

### MailHog starten

```bash
# Wenn mit Go installiert
MailHog

# Oder mit spezifischen Parametern
MailHog -smtp-bind-addr 127.0.0.1:1025 -ui-bind-addr 127.0.0.1:8025
```

### MailHog Web-Interface

Nach dem Start ist das Web-Interface verfügbar unter:
- **URL**: http://localhost:8025
- **SMTP-Port**: 1025

Alle gesendeten E-Mails werden im Web-Interface angezeigt, wo Sie die Verifizierungslinks testen können.

## Produktions-Setup

### Gmail SMTP (Beispiel)

1. **App-Passwort erstellen**:
   - Gehen Sie zu Ihrem Google-Konto
   - Sicherheit → 2-Schritt-Verifizierung → App-Passwörter
   - Erstellen Sie ein neues App-Passwort für "Mail"

2. **Umgebungsvariablen setzen**:
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-16-char-app-password
FROM_EMAIL=noreply@yourdomain.com
BASE_URL=https://yourdomain.com
```

### Andere SMTP-Anbieter

- **SendGrid**: smtp.sendgrid.net:587
- **Mailgun**: smtp.mailgun.org:587
- **Amazon SES**: email-smtp.region.amazonaws.com:587

## Funktionsweise

1. **Registrierung**: Benutzer gibt Benutzername, E-Mail und Passwort ein
2. **E-Mail-Versand**: System sendet Verifizierungs-E-Mail mit eindeutigem Token
3. **Verifizierung**: Benutzer klickt auf Link in E-Mail
4. **Aktivierung**: E-Mail wird als verifiziert markiert
5. **Login**: Benutzer kann sich jetzt anmelden

## API-Endpunkte

- `POST /api/v1/auth/register` - Benutzerregistrierung (sendet Verifizierungs-E-Mail)
- `POST /api/v1/auth/verify-email` - E-Mail-Verifizierung mit Token
- `POST /api/v1/auth/resend-verification` - Verifizierungs-E-Mail erneut senden
- `POST /api/v1/auth/login` - Login (nur mit verifizierter E-Mail möglich)

## Frontend-Routen

- `/register` - Registrierungsformular mit E-Mail-Feld
- `/verify-email?token=...` - E-Mail-Verifizierungsseite
- `/login` - Login-Seite

## Fehlerbehebung

### E-Mails werden nicht gesendet
1. Überprüfen Sie die SMTP-Konfiguration in der `.env`-Datei
2. Stellen Sie sicher, dass MailHog läuft (für lokale Entwicklung)
3. Überprüfen Sie die Backend-Logs auf SMTP-Fehler

### Verifizierungslinks funktionieren nicht
1. Überprüfen Sie die `BASE_URL` in der `.env`-Datei
2. Stellen Sie sicher, dass die Frontend-Route `/verify-email` korrekt konfiguriert ist
3. Überprüfen Sie, ob der Token nicht abgelaufen ist (24 Stunden Gültigkeit)

### Login schlägt fehl
1. Stellen Sie sicher, dass die E-Mail verifiziert wurde
2. Überprüfen Sie die Fehlermeldung - sie sollte auf nicht-verifizierte E-Mail hinweisen
3. Verwenden Sie die "Verifizierungs-E-Mail erneut senden" Funktion

## Sicherheitshinweise

- Verifizierungstoken sind 24 Stunden gültig
- Tokens werden nach erfolgreicher Verifizierung gelöscht
- E-Mail-Adressen müssen eindeutig sein
- Login ist nur mit verifizierten E-Mail-Adressen möglich
