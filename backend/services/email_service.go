package services

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"os"
	"strconv"
	"time"

	"backend/models"

	"gopkg.in/gomail.v2"
	"gorm.io/gorm"
)

// EmailService behandelt E-Mail-Versand und -Verifizierung
type EmailService struct {
	DB *gorm.DB
}

// NewEmailService erstellt eine neue EmailService-Instanz
func NewEmailService(db *gorm.DB) *EmailService {
	return &EmailService{DB: db}
}

// GenerateVerificationToken generiert einen sicheren Verifizierungstoken
func (s *EmailService) GenerateVerificationToken() (string, error) {
	bytes := make([]byte, 32)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}
	return hex.EncodeToString(bytes), nil
}

// SendVerificationEmail sendet eine Verifizierungs-E-Mail an den Benutzer
func (s *EmailService) SendVerificationEmail(user *models.User, token string) error {
	// E-Mail-Konfiguration aus Umgebungsvariablen
	smtpHost := os.Getenv("SMTP_HOST")
	smtpPortStr := os.Getenv("SMTP_PORT")
	smtpUser := os.Getenv("SMTP_USER")
	smtpPass := os.Getenv("SMTP_PASS")
	fromEmail := os.Getenv("FROM_EMAIL")
	baseURL := os.Getenv("BASE_URL")

	// Standardwerte setzen
	if smtpHost == "" {
		smtpHost = "localhost"
	}
	if smtpPortStr == "" {
		smtpPortStr = "1025"
	}
	if fromEmail == "" {
		fromEmail = "noreply@trustme.local"
	}
	if baseURL == "" {
		baseURL = "http://localhost:5173"
	}

	// Port zu Integer konvertieren
	smtpPort, err := strconv.Atoi(smtpPortStr)
	if err != nil {
		return fmt.Errorf("Ungültiger SMTP-Port: %w", err)
	}

	// Verifizierungslink erstellen
	verificationLink := fmt.Sprintf("%s/verify-email?token=%s", baseURL, token)

	// E-Mail-Message mit gomail erstellen
	m := gomail.NewMessage()
	m.SetHeader("From", fromEmail)
	m.SetHeader("To", user.Email)
	m.SetHeader("Subject", "TrustMe - E-Mail-Adresse bestätigen")

	// HTML-Template für die E-Mail
	htmlBody := fmt.Sprintf(`
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>E-Mail-Verifizierung</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #1976d2; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f9f9f9; }
        .button { display: inline-block; padding: 12px 24px; background-color: #1976d2; color: white !important; text-decoration: none; border-radius: 5px; margin: 20px 0; border: none; cursor: pointer; }
        .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔐 TrustMe</h1>
            <p>Sicherer Passwort-Manager</p>
        </div>
        <div class="content">
            <h2>Hallo %s!</h2>
            <p>Vielen Dank für Ihre Registrierung bei TrustMe!</p>
            <p>Bitte bestätigen Sie Ihre E-Mail-Adresse, indem Sie auf den folgenden Button klicken:</p>
            <div style="text-align: center; margin: 20px 0;">
                <a href="%s" style="display: inline-block; padding: 12px 24px; background-color: #1976d2; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;" target="_blank">E-Mail-Adresse bestätigen</a>
            </div>
            <p>Oder kopieren Sie diesen Link in Ihren Browser:</p>
            <p style="word-break: break-all; background-color: #e8e8e8; padding: 10px; border-radius: 3px;">
                %s
            </p>
            <p><strong>Wichtiger Hinweis:</strong> Dieser Link ist 24 Stunden gültig.</p>
            <p>Falls Sie sich nicht bei TrustMe registriert haben, können Sie diese E-Mail ignorieren.</p>
        </div>
        <div class="footer">
            <p>Mit freundlichen Grüßen,<br>Ihr TrustMe Team</p>
            <p>Diese E-Mail wurde automatisch generiert. Bitte antworten Sie nicht auf diese E-Mail.</p>
        </div>
    </div>
</body>
</html>`, user.Username, verificationLink, verificationLink)

	// Plaintext-Alternative
	textBody := fmt.Sprintf(`
Hallo %s,

vielen Dank für Ihre Registrierung bei TrustMe!

Bitte bestätigen Sie Ihre E-Mail-Adresse, indem Sie auf den folgenden Link klicken:

%s

Dieser Link ist 24 Stunden gültig.

Falls Sie sich nicht bei TrustMe registriert haben, können Sie diese E-Mail ignorieren.

Mit freundlichen Grüßen,
Ihr TrustMe Team
`, user.Username, verificationLink)

	m.SetBody("text/plain", textBody)
	m.AddAlternative("text/html", htmlBody)

	// SMTP-Dialer konfigurieren
	var d *gomail.Dialer
	if smtpUser != "" && smtpPass != "" {
		// Mit Authentifizierung (Produktion)
		d = gomail.NewDialer(smtpHost, smtpPort, smtpUser, smtpPass)
		
		// TLS/SSL Konfiguration
		if smtpPort == 465 {
			// SSL
			d.SSL = true
		}
		// Für Port 587 wird StartTLS automatisch verwendet
	} else {
		// Ohne Authentifizierung (lokale Entwicklung mit MailHog)
		d = &gomail.Dialer{
			Host: smtpHost,
			Port: smtpPort,
		}
	}

	// E-Mail senden mit Timeout
	if err := d.DialAndSend(m); err != nil {
		return fmt.Errorf("Fehler beim Senden der E-Mail: %w", err)
	}

	return nil
}

// SetVerificationToken setzt den Verifizierungstoken für einen Benutzer
func (s *EmailService) SetVerificationToken(userID uint, token string) error {
	// Token-Ablaufzeit auf 24 Stunden setzen
	expiry := time.Now().Add(24 * time.Hour)

	result := s.DB.Model(&models.User{}).Where("id = ?", userID).Updates(map[string]interface{}{
		"email_verification_token": token,
		"email_token_expiry":       expiry,
	})

	if result.Error != nil {
		return fmt.Errorf("Fehler beim Setzen des Verifizierungstokens: %w", result.Error)
	}

	return nil
}

// VerifyEmail verifiziert eine E-Mail-Adresse anhand des Tokens
func (s *EmailService) VerifyEmail(token string) error {
	var user models.User

	// Benutzer anhand des Tokens finden
	result := s.DB.Where("email_verification_token = ? AND email_token_expiry > ?", token, time.Now()).First(&user)
	if result.Error != nil {
		if result.Error == gorm.ErrRecordNotFound {
			return fmt.Errorf("Ungültiger oder abgelaufener Verifizierungstoken")
		}
		return fmt.Errorf("Fehler beim Suchen des Benutzers: %w", result.Error)
	}

	// E-Mail als verifiziert markieren und Token löschen
	result = s.DB.Model(&user).Updates(map[string]interface{}{
		"email_verified":            true,
		"email_verification_token": nil,
		"email_token_expiry":       nil,
	})

	if result.Error != nil {
		return fmt.Errorf("Fehler beim Verifizieren der E-Mail: %w", result.Error)
	}

	return nil
}

// ResendVerificationEmail sendet eine neue Verifizierungs-E-Mail
func (s *EmailService) ResendVerificationEmail(email string) error {
	var user models.User

	// Benutzer anhand der E-Mail finden
	result := s.DB.Where("email = ?", email).First(&user)
	if result.Error != nil {
		if result.Error == gorm.ErrRecordNotFound {
			return fmt.Errorf("Benutzer mit dieser E-Mail-Adresse nicht gefunden")
		}
		return fmt.Errorf("Fehler beim Suchen des Benutzers: %w", result.Error)
	}

	// Prüfen, ob E-Mail bereits verifiziert ist
	if user.EmailVerified {
		return fmt.Errorf("E-Mail-Adresse ist bereits verifiziert")
	}

	// Neuen Token generieren
	token, err := s.GenerateVerificationToken()
	if err != nil {
		return fmt.Errorf("Fehler beim Generieren des Tokens: %w", err)
	}

	// Token in der Datenbank setzen
	if err := s.SetVerificationToken(user.ID, token); err != nil {
		return err
	}

	// E-Mail senden
	if err := s.SendVerificationEmail(&user, token); err != nil {
		return err
	}

	return nil
}
