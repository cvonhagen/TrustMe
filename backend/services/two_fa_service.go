package services

import (
	"encoding/base64"
	"errors"
	"fmt"

	"github.com/pquerna/otp/totp"
	"github.com/skip2/go-qrcode"
	"gorm.io/gorm"
)

// TwoFAService behandelt die Logik der Zwei-Faktor-Authentifizierung (2FA).
type TwoFAService struct {
	DB          *gorm.DB     // Datenbankverbindung
	UserService *UserService // Abhängigkeit zum Benutzerdienst
}

// NewTwoFAService erstellt eine neue TwoFAService-Instanz.
func NewTwoFAService(db *gorm.DB, userService *UserService) *TwoFAService {
	return &TwoFAService{DB: db, UserService: userService}
}

// GenerateTwoFASecret generiert ein neues TOTP-Geheimnis und gibt das Geheimnis und den QR-Code als Base64-Bild zurück.
func (s *TwoFAService) GenerateTwoFASecret(userID uint) (secret string, qrCodeBase64 string, err error) {
	// Benutzer anhand der ID abrufen
	user, err := s.UserService.GetUserByID(userID)
	if err != nil {
		return "", "", fmt.Errorf("Benutzer nicht gefunden: %w", err)
	}

	// Neues TOTP-Schlüssel generieren
	key, err := totp.Generate(totp.GenerateOpts{
		Issuer:      "TrustMe Password Manager", // Aussteller der 2FA
		AccountName: user.Username,              // Benutzername als Account-Name
	})
	if err != nil {
		return "", "", fmt.Errorf("Fehler beim Generieren des TOTP-Schlüssels: %w", err)
	}

	secret = key.Secret()
	provisioningURL := key.URL()

	// QR-Code als PNG generieren
	qrCodePNG, err := qrcode.Encode(provisioningURL, qrcode.Medium, 256)
	if err != nil {
		return "", "", fmt.Errorf("Fehler beim Generieren des QR-Codes: %w", err)
	}

	// QR-Code als Base64-String kodieren
	qrCodeBase64 = "data:image/png;base64," + base64.StdEncoding.EncodeToString(qrCodePNG)

	// Das Geheimnis temporär im Benutzermodell speichern für die Verifizierung
	user.TwoFASecret = secret
	// Temporär speichern, aber 2FA noch nicht aktivieren
	if err := s.DB.Save(user).Error; err != nil {
		return "", "", fmt.Errorf("Fehler beim temporären Speichern des 2FA-Geheimnisses: %w", err)
	}

	return secret, qrCodeBase64, nil
}

// VerifyTwoFACode verifiziert den bereitgestellten TOTP-Code anhand des gespeicherten Geheimnisses des Benutzers.
func (s *TwoFAService) VerifyTwoFACode(userID uint, code string) (bool, error) {
	// Benutzer anhand der ID abrufen
	user, err := s.UserService.GetUserByID(userID)
	if err != nil {
		return false, fmt.Errorf("Benutzer nicht gefunden: %w", err)
	}

	// Prüfen, ob das Geheimnis fehlt (während Setup kann 2FA noch nicht aktiviert sein)
	if user.TwoFASecret == "" {
		return false, errors.New("2FA-Geheimnis nicht gefunden")
	}

	// TOTP-Code verifizieren
	valid := totp.Validate(code, user.TwoFASecret)

	return valid, nil
}

// EnableTwoFA aktiviert die Zwei-Faktor-Authentifizierung für den Benutzer.
func (s *TwoFAService) EnableTwoFA(userID uint) error {
	// Benutzer anhand der ID abrufen
	user, err := s.UserService.GetUserByID(userID)
	if err != nil {
		return fmt.Errorf("Benutzer nicht gefunden: %w", err)
	}

	user.TwoFAEnabled = true // 2FA-Flag auf true setzen
	// Benutzer mit aktualisiertem Flag und generiertem Geheimnis speichern (sollte zuvor gespeichert worden sein)
	return s.DB.Save(user).Error
}

// DisableTwoFA deaktiviert die Zwei-Faktor-Authentifizierung für den Benutzer.
func (s *TwoFAService) DisableTwoFA(userID uint) error {
	// Benutzer anhand der ID abrufen
	user, err := s.UserService.GetUserByID(userID)
	if err != nil {
		return fmt.Errorf("Benutzer nicht gefunden: %w", err)
	}

	user.TwoFAEnabled = false // 2FA-Flag auf false setzen
	user.TwoFASecret = ""     // Geheimnis löschen
	return s.DB.Save(user).Error
}
