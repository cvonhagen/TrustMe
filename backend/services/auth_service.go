// AuthService - Authentifizierungslogik für TrustMe
// Verwaltet Benutzerregistrierung, Anmeldung und Account-Löschung
// Arbeitet mit Argon2id für Passwort-Hashing und JWT für Session-Management
package services

import (
	"errors"
	"fmt"

	"backend/models"
	"backend/schemas"
	"backend/security"

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
// Generiert Salt für Frontend-Verschlüsselung und hasht Master-Passwort mit Argon2id
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

	// Salt generieren für Frontend-Verschlüsselung (Standard-Länge)
	// Dieser Salt wird für die client-seitige Schlüsselableitung verwendet
	salt, err := security.GenerateStandardSalt()
	if err != nil {
		return nil, fmt.Errorf("Fehler beim Generieren des Salts: %w", err)
	}

	// Master-Passwort mit Argon2id hashen (moderner Standard)
	// Verwendet OWASP-konforme Parameter für maximale Sicherheit
	hashedPassword, err := security.HashPasswordArgon2id(req.MasterPassword, salt)
	if err != nil {
		return nil, fmt.Errorf("Fehler beim Hashen des Master-Passworts: %w", err)
	}

	// Neuen Benutzer erstellen
	user := &models.User{
		Username:             req.Username,
		Email:                req.Email,
		HashedMasterPassword: hashedPassword,
		Salt:                 salt,  // Dieser Salt ist für das Frontend
		HashType:             "argon2id", // Moderner Hash-Algorithmus
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
// Unterstützt automatische Migration von bcrypt/PBKDF2 zu Argon2id
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

	// Passwort-Verifikation mit automatischer Migration
	var isValid bool
	var isLegacyHash bool
	
	// Intelligente Hash-Erkennung und -Verifikation
	isValid, isLegacyHash, err = security.VerifyPasswordUniversal(req.MasterPassword, user.HashedMasterPassword, user.Salt, user.HashType)
	if err != nil {
		return nil, fmt.Errorf("Fehler bei der Passwort-Verifikation: %w", err)
	}
	
	if !isValid {
		return nil, errors.New("Ungültige Anmeldeinformationen")
	}

	// Lazy Migration: Legacy-Hashes bei erfolgreichem Login auf Argon2id upgraden
	if isLegacyHash {
		if err := s.migrateUserToArgon2id(user, req.MasterPassword); err != nil {
			// Migration-Fehler blockiert Login nicht, nur loggen
			fmt.Printf("WARNUNG: Migration zu Argon2id fehlgeschlagen für User %d: %v\n", user.ID, err)
		}
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

// migrateUserToArgon2id migriert einen User von Legacy-Hash zu Argon2id
// Wird automatisch beim Login aufgerufen für nahtlose Migration
func (s *AuthService) migrateUserToArgon2id(user *models.User, plainPassword string) error {
	// Neuen Argon2id-Hash mit demselben Salt erstellen
	newHash, err := security.HashPasswordArgon2id(plainPassword, user.Salt)
	if err != nil {
		return fmt.Errorf("Fehler beim Erstellen des Argon2id-Hash: %w", err)
	}

	// User in Datenbank mit neuem Hash und Hash-Type updaten
	result := s.DB.Model(user).Updates(map[string]interface{}{
		"hashed_master_password": newHash,
		"hash_type":              "argon2id",
	})

	if result.Error != nil {
		return fmt.Errorf("Fehler beim Speichern der Migration: %w", result.Error)
	}

	// User-Objekt für weitere Verwendung aktualisieren
	user.HashedMasterPassword = newHash
	user.HashType = "argon2id"

	return nil
}

// ScheduleAccountDeletion markiert einen Account für die Löschung (Soft Delete)
// Der Account wird nach 30 Tagen automatisch gelöscht
func (s *AuthService) ScheduleAccountDeletion(userID uint) error {
	return s.UserService.ScheduleAccountDeletion(userID)
}

// DeleteAccount löscht Benutzeraccount und alle verknüpften Daten (veraltet - verwende ScheduleAccountDeletion)
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
