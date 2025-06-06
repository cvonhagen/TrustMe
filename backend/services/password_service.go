package services

import (
	"backend/models"

	"gorm.io/gorm"
)

// PasswordService handles password-related database operations.
type PasswordService struct {
	DB *gorm.DB
}

// NewPasswordService creates a new PasswordService instance.
func NewPasswordService(db *gorm.DB) *PasswordService {
	return &PasswordService{DB: db}
}

// CreatePassword creates a new password entry in the database.
func (s *PasswordService) CreatePassword(password *models.Password) error {
	return s.DB.Create(password).Error
}

// GetPasswordsByUserID retrieves all passwords for a specific user.
func (s *PasswordService) GetPasswordsByUserID(userID uint) ([]models.Password, error) {
	var passwords []models.Password
	res := s.DB.Where("user_id = ?", userID).Find(&passwords)
	if res.Error != nil {
		return nil, res.Error
	}
	return passwords, nil
}

// GetPasswordByID retrieves a specific password entry by ID and user ID.
func (s *PasswordService) GetPasswordByID(passwordID uint, userID uint) (*models.Password, error) {
	var password models.Password
	res := s.DB.Where("id = ? AND user_id = ?", passwordID, userID).First(&password)
	if res.Error != nil {
		return nil, res.Error
	}
	return &password, nil
}

// UpdatePassword updates an existing password entry.
func (s *PasswordService) UpdatePassword(password *models.Password) error {
	return s.DB.Save(password).Error
}

// DeletePassword deletes a password entry by ID and user ID.
func (s *PasswordService) DeletePassword(passwordID uint, userID uint) error {
	res := s.DB.Where("id = ? AND user_id = ?", passwordID, userID).Delete(&models.Password{})
	if res.Error != nil {
		return res.Error
	}
	if res.RowsAffected == 0 {
		return gorm.ErrRecordNotFound // Or a custom error indicating not found
	}
	return nil
}
