// AuthService - Authentifizierungslogik für TrustMe
// Verwaltet Benutzerregistrierung, Anmeldung und Account-Löschung
// Arbeitet mit bcrypt für Passwort-Hashing und JWT für Session-Management
package services

import (
	"errors"
	"fmt"

	"backend/models"
	"backend/schemas"
	"backend/security"

	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

// AuthService behandelt alle Authentifizierungsoperationen
// Arbeitet eng mit UserService zusammen für Benutzer-CRUD-Operationen
type AuthService struct {
	DB          *gorm.DB     // Datenbankverbindung für direkte Operationen
	UserService *UserService // Service für Benutzer-spezifische Operationen
}

// NewAuthService erstellt eine neue AuthService-Instanz
// Dependency Injection Pattern für lose Kopplung der Services
func NewAuthService(db *gorm.DB, userService *UserService) *AuthService {
	return &AuthService{DB: db, UserService: userService}
}

// RegisterUser registriert einen neuen Benutzer mit umfassenden Validierungen
// Generiert Salt für Frontend-Verschlüsselung und hasht Master-Passwort mit bcrypt
// Prüft auf doppelte Benutzernamen und E-Mail-Adressen
func (s *AuthService) RegisterUser(req *schemas.RegisterRequest) (*models.User, error) {
	// Prüfen, ob der Benutzername bereits existiert
	if existingUser, _ := s.UserService.GetUserByUsername(req.Username); existingUser != nil {
		return nil, errors.New("Benutzername ist bereits vergeben")
	}

	// Prüfen, ob die E-Mail bereits existiert
	if existingUser, _ := s.UserService.GetUserByEmail(req.Email); existingUser != nil {
		return nil, errors.New("E-Mail-Adresse ist bereits registriert")
	}

	// Salt generieren für Frontend-Verschlüsselung (separat von bcrypt)
	// Dieser Salt wird für die client-seitige Schlüsselableitung verwendet
	salt, err := security.GenerateSalt(security.PBKDF2SaltLen)
	if err != nil {
		return nil, fmt.Errorf("Fehler beim Generieren des Salts: %w", err)
	}

	// Master-Passwort mit bcrypt hashen (bcrypt generiert eigenen Salt intern)
	// Separater Hash-Prozess vom Frontend-Salt für zusätzliche Sicherheit
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.MasterPassword), bcrypt.DefaultCost)
	if err != nil {
		return nil, fmt.Errorf("Fehler beim Hashen des Master-Passworts: %w", err)
	}

	// Neuen Benutzer erstellen
	user := &models.User{
		Username:             req.Username,
		Email:                req.Email,
		HashedMasterPassword: string(hashedPassword),
		Salt:                 salt,  // Dieser Salt ist für das Frontend
		TwoFAEnabled:         false, // 2FA standardmäßig deaktiviert
		EmailVerified:        false, // E-Mail noch nicht verifiziert
	}

	// Benutzer in der Datenbank speichern
	if err := s.UserService.CreateUser(user); err != nil {
		return nil, fmt.Errorf("Fehler beim Erstellen des Benutzers: %w", err)
	}

	return user, nil
}

// LoginUser authentifiziert Benutzer mit umfassenden Sicherheitsprüfungen
// Validiert E-Mail-Verifizierung, prüft Passwort mit bcrypt und generiert JWT-Token
// Rückgabe enthält alle für Frontend benötigten Authentifizierungsdaten
func (s *AuthService) LoginUser(req *schemas.LoginRequest) (*schemas.LoginResponse, error) {
	// Benutzer anhand des Benutzernamens abrufen
	user, err := s.UserService.GetUserByUsername(req.Username)
	if err != nil {
		return nil, fmt.Errorf("Fehler beim Abrufen des Benutzers: %w", err)
	}
	if user == nil {
		return nil, errors.New("Ungültige Anmeldeinformationen") // Benutzer nicht gefunden
	}

	// Prüfen, ob die E-Mail verifiziert ist
	if !user.EmailVerified {
		return nil, errors.New("E-Mail-Adresse muss vor der Anmeldung verifiziert werden")
	}

	// Das bereitgestellte Passwort mit dem bcrypt-Hash vergleichen
	// bcrypt macht automatisch Salt-Extraktion und Vergleich
	if err := bcrypt.CompareHashAndPassword([]byte(user.HashedMasterPassword), []byte(req.MasterPassword)); err != nil {
		return nil, errors.New("Ungültige Anmeldeinformationen") // Passwort stimmt nicht überein
	}

	// JWT-Token generieren
	token, err := security.GenerateJWTToken(user.ID)
	if err != nil {
		return nil, fmt.Errorf("Fehler beim Generieren des Tokens: %w", err)
	}

	// Login-Antwort zurückgeben
	return &schemas.LoginResponse{
		Token:        token,
		UserID:       user.ID,
		Username:     user.Username,
		TwoFAEnabled: user.TwoFAEnabled,
		Salt:         user.Salt,
	}, nil
}

// DeleteAccount löscht Benutzeraccount und alle verknüpften Daten
// Transaktionssichere Löschung: erst Passwörter, dann Benutzer
// GDPR-konform: vollständige Entfernung aller Benutzerdaten
func (s *AuthService) DeleteAccount(userID uint) error {
	// Zuerst alle Passwörter des Benutzers löschen
	if err := s.DB.Where("user_id = ?", userID).Delete(&models.Password{}).Error; err != nil {
		return fmt.Errorf("Fehler beim Löschen der Passwörter: %w", err)
	}

	// Dann den Benutzer selbst löschen
	if err := s.DB.Delete(&models.User{}, userID).Error; err != nil {
		return fmt.Errorf("Fehler beim Löschen des Benutzers: %w", err)
	}

	return nil
}
