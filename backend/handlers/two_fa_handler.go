package handlers

import (
	"backend/schemas"
	"backend/security"
	"backend/services"
	"errors"

	"github.com/gofiber/fiber/v2"
	"github.com/pquerna/otp/totp"
	"gorm.io/gorm"
)

// TwoFAHandler handles 2FA related requests.
type TwoFAHandler struct {
	TwoFAService *services.TwoFAService
	UserService  *services.UserService
}

// NewTwoFAHandler creates a new TwoFAHandler instance.
func NewTwoFAHandler(twoFAService *services.TwoFAService, userService *services.UserService) *TwoFAHandler {
	return &TwoFAHandler{TwoFAService: twoFAService, UserService: userService}
}

// InitiateSetup handles the request to initiate 2FA setup for the authenticated user.
func (h *TwoFAHandler) InitiateSetup(c *fiber.Ctx) error {
	userID := c.Locals("userID").(uint)

	secret, provisioningURL, err := h.TwoFAService.GenerateTwoFASecret(userID)
	if err != nil {
		// Check if user not found error
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "User not found"})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to initiate 2FA setup"})
	}

	// Note: Returning the secret is for displaying the QR code.
	// The secret is also stored temporarily with the user in the service layer.
	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"secret":           secret,
		"provisioning_url": provisioningURL,
	})
}

// VerifySetupCode handles the request to verify the 2FA code during setup.
func (h *TwoFAHandler) VerifySetupCode(c *fiber.Ctx) error {
	userID := c.Locals("userID").(uint)

	var req schemas.TwoFactorSetupRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	// Verify the code using the secret stored temporarily during InitiateSetup
	valid, err := h.TwoFAService.VerifyTwoFACode(userID, req.Code)
	if err != nil {
		// Check specific errors like 2FA not enabled
		if err.Error() == "2FA is not enabled for this user" { // This check relies on the error string from service
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to verify 2FA code"})
	}

	if !valid {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Invalid 2FA code"})
	}

	// If valid, enable 2FA for the user
	if err := h.TwoFAService.EnableTwoFA(userID); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to enable 2FA"})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"message": "2FA enabled successfully",
	})
}

// VerifyLoginCode handles the request to verify the 2FA code during login.
// This endpoint is called after successful password verification if 2FA is enabled.
func (h *TwoFAHandler) VerifyLoginCode(c *fiber.Ctx) error {
	var req schemas.TwoFactorVerifyRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	// Retrieve the user by username to get their ID and 2FA secret
	user, err := h.UserService.GetUserByUsername(req.Username)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			// Avoid revealing if user exists or not for security reasons
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Invalid username or code"})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Error retrieving user"})
	}

	// Check if 2FA is enabled for this user
	if !user.TwoFAEnabled || user.TwoFASecret == "" {
		// This should ideally not happen if frontend logic is correct, but good to handle defensively
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "2FA is not enabled for this user"})
	}

	// Verify the provided 2FA code
	valid := totp.Validate(req.Code, user.TwoFASecret)
	if !valid {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Invalid username or code"})
	}

	// If code is valid, generate and return a JWT token
	token, err := security.GenerateJWTToken(user.ID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to generate token after 2FA"})
	}

	// Return login success response including the token and salt
	return c.Status(fiber.StatusOK).JSON(schemas.LoginResponse{
		Token:        token,
		UserID:       user.ID,
		Username:     user.Username,
		TwoFAEnabled: user.TwoFAEnabled,
		Salt:         user.Salt, // Include salt for client-side decryption
	})
}

// DisableTwoFA handles the request to disable 2FA for the authenticated user.
func (h *TwoFAHandler) DisableTwoFA(c *fiber.Ctx) error {
	userID := c.Locals("userID").(uint)

	if err := h.TwoFAService.DisableTwoFA(userID); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to disable 2FA",
		})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"message": "2FA disabled successfully",
	})
}
