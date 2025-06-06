package services

import (
	"backend/models"

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

// GetUserByUsername retrieves a user by their username.
// It returns the user and nil error if found, nil and nil error if not found, or nil and an error if a database error occurred.
func (s *UserService) GetUserByUsername(username string) (*models.User, error) {
	var user models.User
	res := s.DB.Where("username = ?", username).First(&user)

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

// GetUserByID retrieves a user by their ID.
// It returns the user and nil error if found, nil and nil error if not found, or nil and an error if a database error occurred.
func (s *UserService) GetUserByID(userID uint) (*models.User, error) {
	var user models.User
	res := s.DB.First(&user, userID)
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
