package services

import (
	"errors"
	"fmt"
	"log"

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
	log.Printf("AuthService.LoginUser: Attempting to get user by username: %s", req.Username) // Debugging
	if err != nil {
		log.Printf("AuthService.LoginUser: Error getting user %s: %v", req.Username, err) // Debugging
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("invalid username or password")
		}
		return nil, fmt.Errorf("error retrieving user: %w", err)
	}

	log.Printf("AuthService.LoginUser: User found: %s (ID: %d)", user.Username, user.ID) // Debugging: Bestätige, dass der Benutzer gefunden wurde

	// Verify master password
	match, err := security.VerifyPassword(req.MasterPassword, user.HashedMasterPassword, user.Salt)
	if err != nil {
		log.Printf("AuthService.LoginUser: Error verifying password for user %s: %v", user.Username, err) // Debugging
		return nil, fmt.Errorf("error verifying password: %w", err)
	}
	if !match {
		log.Printf("AuthService.LoginUser: Password mismatch for user: %s", user.Username) // Debugging
		return nil, errors.New("invalid username or password")
	}

	log.Printf("AuthService.LoginUser: Password match for user: %s", user.Username) // Debugging

	// Generate JWT token
	token, err := security.GenerateJWTToken(user.ID)
	if err != nil {
		log.Printf("AuthService.LoginUser: Error generating token for user %s: %v", user.Username, err) // Debugging
		return nil, fmt.Errorf("failed to generate JWT token: %w", err)
	}

	log.Printf("AuthService.LoginUser: Token generated successfully for user: %s", user.Username) // Debugging

	// Return login response
	loginResponse := &schemas.LoginResponse{
		Token:        token,
		UserID:       user.ID,
		Username:     user.Username,
		TwoFAEnabled: user.TwoFAEnabled,
		Salt:         user.Salt, // Include salt for client-side decryption
	}
	log.Printf("AuthService.LoginUser: Returning successful login response for user: %s", user.Username) // Debugging vor Return
	return loginResponse, nil
}
