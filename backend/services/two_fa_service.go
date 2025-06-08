package services

import (
	"errors"
	"fmt"

	"github.com/pquerna/otp/totp"
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

// GenerateTwoFASecret generiert ein neues TOTP-Geheimnis und gibt das Geheimnis und die Provisionierungs-URL zurück.
func (s *TwoFAService) GenerateTwoFASecret(userID uint) (secret string, provisioningURL string, err error) {
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
	provisioningURL = key.URL()

	// Das Geheimnis im Benutzermodell speichern (aber noch nicht speichern)
	user.TwoFASecret = secret

	return secret, provisioningURL, nil
}

// VerifyTwoFACode verifiziert den bereitgestellten TOTP-Code anhand des gespeicherten Geheimnisses des Benutzers.
func (s *TwoFAService) VerifyTwoFACode(userID uint, code string) (bool, error) {
	// Benutzer anhand der ID abrufen
	user, err := s.UserService.GetUserByID(userID)
	if err != nil {
		return false, fmt.Errorf("Benutzer nicht gefunden: %w", err)
	}

	// Prüfen, ob 2FA für diesen Benutzer aktiviert ist oder ob das Geheimnis fehlt
	if !user.TwoFAEnabled || user.TwoFASecret == "" {
		return false, errors.New("2FA ist für diesen Benutzer nicht aktiviert")
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
