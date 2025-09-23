package services

import (
	"backend/models"
	"backend/schemas"
	"fmt"
	"time"

	"gorm.io/gorm"
)

// UserService handles user-related database operations.
type UserService struct {
	DB *gorm.DB
}

// NewUserService creates a new UserService instance.
func NewUserService(db *gorm.DB) *UserService {
	return &UserService{DB: db}
}

// CreateUser creates a new user in the database.
func (s *UserService) CreateUser(user *models.User) error {
	return s.DB.Create(user).Error
}

// GetUserByUsername retrieves a user by their username (nur aktive User).
// It returns the user and nil error if found, nil and nil error if not found, or nil and an error if a database error occurred.
func (s *UserService) GetUserByUsername(username string) (*models.User, error) {
	var user models.User
	res := s.DB.Where("username = ? AND deleted_at IS NULL", username).First(&user)

	if res.Error != nil {
		// Check if the error is specifically ErrRecordNotFound
		if res.Error == gorm.ErrRecordNotFound {
			return nil, nil // User not found, return nil user and nil error
		}
		// For any other error, return nil user and the error
		return nil, res.Error
	}

	return &user, nil // User found, return user and nil error
}

// GetUserByEmail retrieves a user by their email address (nur aktive User).
// It returns the user and nil error if found, nil and nil error if not found, or nil and an error if a database error occurred.
func (s *UserService) GetUserByEmail(email string) (*models.User, error) {
	var user models.User
	res := s.DB.Where("email = ? AND deleted_at IS NULL", email).First(&user)

	if res.Error != nil {
		// Check if the error is specifically ErrRecordNotFound
		if res.Error == gorm.ErrRecordNotFound {
			return nil, nil // User not found, return nil user and nil error
		}
		// For any other error, return nil user and the error
		return nil, res.Error
	}

	return &user, nil // User found, return user and nil error
}

// GetUserByID retrieves a user by their ID (nur aktive User).
// It returns the user and nil error if found, nil and nil error if not found, or nil and an error if a database error occurred.
func (s *UserService) GetUserByID(userID uint) (*models.User, error) {
	var user models.User
	res := s.DB.Where("id = ? AND deleted_at IS NULL", userID).First(&user)
	if res.Error != nil {
		// Check if the error is specifically ErrRecordNotFound
		if res.Error == gorm.ErrRecordNotFound {
			return nil, nil // User not found, return nil user and nil error
		}
		// For any other error, return nil user and the error
		return nil, res.Error
	}
	return &user, nil // User found, return user and nil error
}

// UpdateUserProfile updates a user's profile.
func (s *UserService) UpdateUserProfile(userID uint, req *schemas.UpdateProfileRequest) (*models.User, error) {
	var user models.User
	if err := s.DB.First(&user, userID).Error; err != nil {
		return nil, fmt.Errorf("user not found: %w", err)
	}

	if req.Username != nil {
		user.Username = *req.Username
	}
	if req.Email != nil {
		user.Email = *req.Email
	}

	// Handle password update separately if needed, as it involves hashing
	// For now, assuming password changes are handled by a dedicated auth service

	if err := s.DB.Save(&user).Error; err != nil {
		return nil, fmt.Errorf("failed to update user profile: %w", err)
	}

	return &user, nil
}

// ScheduleAccountDeletion markiert einen Account für die Löschung (Soft Delete).
// Der Account wird nach 30 Tagen automatisch gelöscht.
func (s *UserService) ScheduleAccountDeletion(userID uint) error {
	now := time.Now()
	deletionDate := now.AddDate(0, 0, 30) // 30 Tage in der Zukunft

	var user models.User
	if err := s.DB.First(&user, userID).Error; err != nil {
		return fmt.Errorf("user not found: %w", err)
	}

	// Markiere als gelöscht und setze Löschungsdatum
	user.DeletedAt = &now
	user.DeletionScheduledAt = &deletionDate

	if err := s.DB.Save(&user).Error; err != nil {
		return fmt.Errorf("failed to schedule account deletion: %w", err)
	}

	return nil
}

// RestoreAccount stellt einen gelöschten Account wieder her (innerhalb der 30 Tage).
func (s *UserService) RestoreAccount(userID uint) error {
	var user models.User
	if err := s.DB.Unscoped().First(&user, userID).Error; err != nil {
		return fmt.Errorf("user not found: %w", err)
	}

	// Prüfe ob der Account wirklich zum Löschen markiert ist
	if user.DeletedAt == nil {
		return fmt.Errorf("account is not scheduled for deletion")
	}

	// Prüfe ob die 30 Tage noch nicht abgelaufen sind
	if user.DeletionScheduledAt != nil && time.Now().After(*user.DeletionScheduledAt) {
		return fmt.Errorf("account restoration period has expired")
	}

	// Stelle den Account wieder her
	user.DeletedAt = nil
	user.DeletionScheduledAt = nil

	if err := s.DB.Save(&user).Error; err != nil {
		return fmt.Errorf("failed to restore account: %w", err)
	}

	return nil
}

// PermanentlyDeleteExpiredAccounts löscht alle Accounts die älter als 30 Tage gelöscht sind.
// Diese Funktion sollte regelmäßig (z.B. täglich) ausgeführt werden.
func (s *UserService) PermanentlyDeleteExpiredAccounts() error {
	now := time.Now()
	
	// Finde alle User die vor mehr als 30 Tagen gelöscht wurden
	var expiredUsers []models.User
	if err := s.DB.Unscoped().Where("deleted_at IS NOT NULL AND deletion_scheduled_at < ?", now).Find(&expiredUsers).Error; err != nil {
		return fmt.Errorf("failed to find expired accounts: %w", err)
	}

	// Lösche alle Passwörter der abgelaufenen User
	for _, user := range expiredUsers {
		if err := s.DB.Unscoped().Where("user_id = ?", user.ID).Delete(&models.Password{}).Error; err != nil {
			return fmt.Errorf("failed to delete passwords for user %d: %w", user.ID, err)
		}
	}

	// Lösche die User permanent
	if err := s.DB.Unscoped().Where("deleted_at IS NOT NULL AND deletion_scheduled_at < ?", now).Delete(&models.User{}).Error; err != nil {
		return fmt.Errorf("failed to permanently delete expired accounts: %w", err)
	}

	return nil
}

// DeleteUserAccount ist jetzt deprecated - verwende ScheduleAccountDeletion stattdessen
// DeleteUserAccount deletes a user's account from the database.
func (s *UserService) DeleteUserAccount(userID uint) error {
	// Delete associated passwords first to avoid foreign key constraint issues
	if err := s.DB.Where("user_id = ?", userID).Delete(&models.Password{}).Error; err != nil {
		return fmt.Errorf("failed to delete user's passwords: %w", err)
	}

	// Then delete the user
	if err := s.DB.Delete(&models.User{}, userID).Error; err != nil {
		return fmt.Errorf("failed to delete user account: %w", err)
	}

	return nil
}
