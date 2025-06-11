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

// AuthService behandelt Authentifizierungslogik wie Registrierung und Login.
type AuthService struct {
	DB          *gorm.DB
	UserService *UserService // Abhängigkeit zum UserService
}

// NewAuthService erstellt eine neue AuthService-Instanz.
func NewAuthService(db *gorm.DB, userService *UserService) *AuthService {
	return &AuthService{DB: db, UserService: userService}
}

// RegisterUser registriert einen neuen Benutzer in der Datenbank.
// Es hasht das Master-Passwort und speichert den Benutzer.
func (s *AuthService) RegisterUser(req *schemas.RegisterRequest) error {
	// Prüfen, ob der Benutzername oder die E-Mail bereits existiert
	if existingUser, _ := s.UserService.GetUserByUsername(req.Username); existingUser != nil {
		return errors.New("Benutzername ist bereits vergeben")
	}

	// TODO: E-Mail-Existenzprüfung hinzufügen, falls E-Mail eindeutig sein soll

	// Salt generieren (für Frontend-Schlüsselableitung)
	salt, err := security.GenerateSalt()
	if err != nil {
		return fmt.Errorf("Fehler beim Generieren des Salts: %w", err)
	}

	// Master-Passwort hashen (bcrypt generiert seinen eigenen Salt intern)
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.MasterPassword), bcrypt.DefaultCost)
	if err != nil {
		return fmt.Errorf("Fehler beim Hashen des Master-Passworts: %w", err)
	}

	// Neuen Benutzer erstellen
	user := &models.User{
		Username:             req.Username,
		Email:                req.Email,
		HashedMasterPassword: string(hashedPassword),
		Salt:                 salt,  // Dieser Salt ist für das Frontend
		TwoFAEnabled:         false, // 2FA standardmäßig deaktiviert
	}

	// Benutzer in der Datenbank speichern
	if err := s.UserService.CreateUser(user); err != nil {
		return fmt.Errorf("Fehler beim Erstellen des Benutzers: %w", err)
	}

	return nil
}

// LoginUser authentifiziert einen Benutzer anhand seiner Anmeldeinformationen.
// Bei erfolgreicher Authentifizierung wird ein JWT-Token generiert und die Benutzerdetails zurückgegeben.
func (s *AuthService) LoginUser(req *schemas.LoginRequest) (*schemas.LoginResponse, error) {
	// Benutzer anhand des Benutzernamens abrufen
	user, err := s.UserService.GetUserByUsername(req.Username)
	if err != nil {
		return nil, fmt.Errorf("Fehler beim Abrufen des Benutzers: %w", err)
	}
	if user == nil {
		return nil, errors.New("Ungültige Anmeldeinformationen") // Benutzer nicht gefunden
	}

	// Das bereitgestellte Passwort mit dem gespeicherten Hash vergleichen (ohne den zusätzlichen Salt)
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
