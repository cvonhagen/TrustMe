package services

import (
	"backend/models"
	"backend/schemas"
	"fmt"

	"gorm.io/gorm"
)

// PasswordService behandelt passwortbezogene Datenbankoperationen.
type PasswordService struct {
	DB *gorm.DB
}

// NewPasswordService erstellt eine neue PasswordService-Instanz.
func NewPasswordService(db *gorm.DB) *PasswordService {
	return &PasswordService{DB: db}
}

// CreatePassword erstellt einen neuen Passwort-Eintrag in der Datenbank.
func (s *PasswordService) CreatePassword(userID uint, req *schemas.CreatePasswordRequest) (*models.Password, error) {
	password := &models.Password{
		UserID:            userID,
		WebsiteURL:        req.WebsiteURL,
		EncryptedUsername: req.EncryptedUsername,
		UsernameIV:        req.UsernameIV,
		UsernameTag:       req.UsernameTag,
		EncryptedPassword: req.EncryptedPassword,
		PasswordIV:        req.PasswordIV,
		PasswordTag:       req.PasswordTag,
		EncryptedNotes:    req.EncryptedNotes,
		NotesIV:           req.NotesIV,
		NotesTag:          req.NotesTag,
	}

	if err := s.DB.Create(password).Error; err != nil {
		return nil, fmt.Errorf("Fehler beim Erstellen des Passworts: %w", err)
	}

	return password, nil
}

// BatchCreatePasswords erstellt mehrere Passwort-Einträge in einer einzigen Transaktion.
func (s *PasswordService) BatchCreatePasswords(userID uint, req *schemas.BatchCreatePasswordRequest) ([]models.Password, error) {
	var passwordsToCreate []models.Password
	for _, p := range req.Passwords {
		passwordsToCreate = append(passwordsToCreate, models.Password{
			UserID:            userID,
			WebsiteURL:        p.WebsiteURL,
			EncryptedUsername: p.EncryptedUsername,
			UsernameIV:        p.UsernameIV,
			UsernameTag:       p.UsernameTag,
			EncryptedPassword: p.EncryptedPassword,
			PasswordIV:        p.PasswordIV,
			PasswordTag:       p.PasswordTag,
			EncryptedNotes:    p.EncryptedNotes,
			NotesIV:           p.NotesIV,
			NotesTag:          p.NotesTag,
		})
	}

	// Transaktion starten
	err := s.DB.Transaction(func(tx *gorm.DB) error {
		// Massen-Einfügung der Passwörter. Batch-Größe von 1000 ist ein guter Startwert.
		if err := tx.CreateInBatches(passwordsToCreate, 1000).Error; err != nil {
			return fmt.Errorf("Fehler beim Massen-Erstellen der Passwörter: %w", err)
		}
		return nil
	})

	if err != nil {
		return nil, err
	}

	return passwordsToCreate, nil
}

// GetPasswordsByUserID ruft alle Passwörter für einen bestimmten Benutzer ab.
func (s *PasswordService) GetPasswordsByUserID(userID uint) ([]models.Password, error) {
	var passwords []models.Password
	if err := s.DB.Where("user_id = ?", userID).Find(&passwords).Error; err != nil {
		return nil, fmt.Errorf("Fehler beim Abrufen der Passwörter für Benutzer %d: %w", userID, err)
	}
	return passwords, nil
}

// GetPasswordByID ruft ein einzelnes Passwort anhand seiner ID und der Benutzer-ID ab.
func (s *PasswordService) GetPasswordByID(passwordID, userID uint) (*models.Password, error) {
	var password models.Password
	if err := s.DB.Where("id = ? AND user_id = ?", passwordID, userID).First(&password).Error; err != nil {
		return nil, fmt.Errorf("Passwort mit ID %d für Benutzer %d nicht gefunden oder Fehler beim Abrufen: %w", passwordID, userID, err)
	}
	return &password, nil
}

// UpdatePassword aktualisiert einen bestehenden Passwort-Eintrag.
func (s *PasswordService) UpdatePassword(passwordID, userID uint, req *schemas.UpdatePasswordRequest) (*models.Password, error) {
	var password models.Password
	// Das vorhandene Passwort abrufen, um sicherzustellen, dass es dem Benutzer gehört
	if err := s.DB.Where("id = ? AND user_id = ?", passwordID, userID).First(&password).Error; err != nil {
		return nil, fmt.Errorf("Passwort mit ID %d für Benutzer %d nicht gefunden oder Fehler beim Aktualisieren: %w", passwordID, userID, err)
	}

	// Felder nur aktualisieren, wenn sie im Anfrage-Payload vorhanden sind
	if req.WebsiteURL != nil {
		password.WebsiteURL = *req.WebsiteURL
	}
	if req.EncryptedUsername != nil {
		password.EncryptedUsername = *req.EncryptedUsername
	}
	if req.UsernameIV != nil {
		password.UsernameIV = *req.UsernameIV
	}
	if req.UsernameTag != nil {
		password.UsernameTag = *req.UsernameTag
	}
	if req.EncryptedPassword != nil {
		password.EncryptedPassword = *req.EncryptedPassword
	}
	if req.PasswordIV != nil {
		password.PasswordIV = *req.PasswordIV
	}
	if req.PasswordTag != nil {
		password.PasswordTag = *req.PasswordTag
	}
	if req.EncryptedNotes != nil {
		password.EncryptedNotes = *req.EncryptedNotes
	}
	if req.NotesIV != nil {
		password.NotesIV = *req.NotesIV
	}
	if req.NotesTag != nil {
		password.NotesTag = *req.NotesTag
	}

	// Passwort in der Datenbank speichern
	if err := s.DB.Save(password).Error; err != nil {
		return nil, fmt.Errorf("Fehler beim Aktualisieren des Passworts: %w", err)
	}

	return &password, nil
}

// DeletePassword löscht einen Passwort-Eintrag aus der Datenbank.
func (s *PasswordService) DeletePassword(passwordID, userID uint) error {
	// Löschen, um sicherzustellen, dass nur das eigene Passwort gelöscht wird
	if err := s.DB.Where("id = ? AND user_id = ?", passwordID, userID).Delete(&models.Password{}).Error; err != nil {
		return fmt.Errorf("Fehler beim Löschen des Passworts mit ID %d für Benutzer %d: %w", passwordID, userID, err)
	}
	return nil
}
