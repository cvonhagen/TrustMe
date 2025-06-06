package services

import (
	"errors"
	"fmt"

	"github.com/pquerna/otp/totp"
	"gorm.io/gorm"
)

// TwoFAService handles 2FA logic.
type TwoFAService struct {
	DB          *gorm.DB
	UserService *UserService
}

// NewTwoFAService creates a new TwoFAService instance.
func NewTwoFAService(db *gorm.DB, userService *UserService) *TwoFAService {
	return &TwoFAService{DB: db, UserService: userService}
}

// GenerateTwoFASecret generates a new TOTP secret and returns the secret and the provisioning URL.
func (s *TwoFAService) GenerateTwoFASecret(userID uint) (secret string, provisioningURL string, err error) {
	user, err := s.UserService.GetUserByID(userID)
	if err != nil {
		return "", "", fmt.Errorf("user not found: %w", err)
	}

	// Generate a new TOTP key
	key, err := totp.Generate(totp.GenerateOpts{
		Issuer:      "TrustMe Password Manager",
		AccountName: user.Username,
	})
	if err != nil {
		return "", "", fmt.Errorf("failed to generate TOTP key: %w", err)
	}

	secret = key.Secret()
	provisioningURL = key.URL()

	// Store the secret in the user model (but don't save yet)
	user.TwoFASecret = secret

	return secret, provisioningURL, nil
}

// VerifyTwoFACode verifies the provided TOTP code against the user's stored secret.
func (s *TwoFAService) VerifyTwoFACode(userID uint, code string) (bool, error) {
	user, err := s.UserService.GetUserByID(userID)
	if err != nil {
		return false, fmt.Errorf("user not found: %w", err)
	}

	if !user.TwoFAEnabled || user.TwoFASecret == "" {
		return false, errors.New("2FA is not enabled for this user")
	}

	valid := totp.Validate(code, user.TwoFASecret)

	return valid, nil
}

// EnableTwoFA sets the two_fa_enabled flag for the user.
func (s *TwoFAService) EnableTwoFA(userID uint) error {
	user, err := s.UserService.GetUserByID(userID)
	if err != nil {
		return fmt.Errorf("user not found: %w", err)
	}

	user.TwoFAEnabled = true
	// Save the user with the updated flag and the generated secret (which should have been stored earlier)
	return s.DB.Save(user).Error
}
