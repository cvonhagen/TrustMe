package services

import (
	"errors"
	"fmt"

	"backend/models"
	"backend/schemas"
	"backend/security"

	"gorm.io/gorm"
)

// AuthService handles authentication logic.
type AuthService struct {
	DB          *gorm.DB
	UserService *UserService
}

// NewAuthService creates a new AuthService instance.
func NewAuthService(db *gorm.DB, userService *UserService) *AuthService {
	return &AuthService{DB: db, UserService: userService}
}

// RegisterUser handles user registration.
func (s *AuthService) RegisterUser(req *schemas.RegisterRequest) error {
	// Check if user already exists
	existingUser, err := s.UserService.GetUserByUsername(req.Username)
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		// An actual error occurred, not just record not found
		return fmt.Errorf("error checking existing user: %w", err)
	}
	if existingUser != nil {
		return errors.New("user with this username already exists")
	}

	// Hash the master password
	hashedPassword, salt, err := security.HashPassword(req.MasterPassword)
	if err != nil {
		return fmt.Errorf("failed to hash password: %w", err)
	}

	// Create new user model
	newUser := &models.User{
		Username:             req.Username,
		HashedMasterPassword: hashedPassword,
		Salt:                 salt,
		TwoFAEnabled:         false, // Default to false
	}

	// Create user in database
	err = s.UserService.CreateUser(newUser)
	if err != nil {
		return fmt.Errorf("failed to create user: %w", err)
	}

	return nil
}

// LoginUser handles user login and returns a JWT token and user details.
func (s *AuthService) LoginUser(req *schemas.LoginRequest) (*schemas.LoginResponse, error) {
	// Get user by username
	user, err := s.UserService.GetUserByUsername(req.Username)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("invalid username or password")
		}
		return nil, fmt.Errorf("error retrieving user: %w", err)
	}

	// Verify master password
	match, err := security.VerifyPassword(req.MasterPassword, user.HashedMasterPassword, user.Salt)
	if err != nil {
		return nil, fmt.Errorf("error verifying password: %w", err)
	}
	if !match {
		return nil, errors.New("invalid username or password")
	}

	// Generate JWT token
	token, err := security.GenerateJWTToken(user.ID)
	if err != nil {
		return nil, fmt.Errorf("failed to generate JWT token: %w", err)
	}

	// Return login response
	return &schemas.LoginResponse{
		Token:        token,
		UserID:       user.ID,
		Username:     user.Username,
		TwoFAEnabled: user.TwoFAEnabled,
		Salt:         user.Salt, // Include salt for client-side decryption
	}, nil
}
