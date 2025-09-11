package handlers

import (
	"backend/schemas"
	"backend/services"

	"github.com/gofiber/fiber/v2"
)

// AuthHandler handles authentication related requests.
type AuthHandler struct {
	AuthService  *services.AuthService
	EmailService *services.EmailService
}

// NewAuthHandler creates a new AuthHandler instance.
func NewAuthHandler(authService *services.AuthService, emailService *services.EmailService) *AuthHandler {
	return &AuthHandler{
		AuthService:  authService,
		EmailService: emailService,
	}
}

// Register handles user registration requests.
func (h *AuthHandler) Register(c *fiber.Ctx) error {
	var req schemas.RegisterRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	user, err := h.AuthService.RegisterUser(&req)
	if err != nil {
		// More specific error handling could be added here based on the error type
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	// Verifizierungstoken generieren
	token, err := h.EmailService.GenerateVerificationToken()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Fehler beim Generieren des Verifizierungstokens",
		})
	}

	// Token in Neon DB speichern
	if err := h.EmailService.SetVerificationToken(user.ID, token); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Fehler beim Speichern des Verifizierungstokens in der Datenbank",
		})
	}

	// E-Mail senden (nur wenn DB-Speicherung erfolgreich)
	if err := h.EmailService.SendVerificationEmail(user, token); err != nil {
		// E-Mail-Fehler ist nicht kritisch - User ist registriert und Token ist in DB
		// Log den Fehler, aber blockiere die Registrierung nicht
		return c.Status(fiber.StatusCreated).JSON(fiber.Map{
			"message": "Registrierung erfolgreich! E-Mail-Versand fehlgeschlagen - bitte verwenden Sie 'E-Mail erneut senden'.",
			"email_error": true,
		})
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"message": "Registrierung erfolgreich! Bitte überprüfen Sie Ihre E-Mails zur Bestätigung.",
	})
}

// Login handles user login requests.
func (h *AuthHandler) Login(c *fiber.Ctx) error {
	var req schemas.LoginRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	loginRes, err := h.AuthService.LoginUser(&req)
	if err != nil {
		// More specific error handling for invalid credentials vs internal errors
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.Status(fiber.StatusOK).JSON(loginRes)
}

// Logout handles user logout requests.
func (h *AuthHandler) Logout(c *fiber.Ctx) error {
	// Invalidate the token or session on the server-side if applicable.
	// For JWT, invalidation often happens on the client by discarding the token.
	// If a server-side session or token blacklist is used, implement that here.
	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"message": "Successfully logged out",
	})
}

// DeleteAccount handles user account deletion requests.
func (h *AuthHandler) DeleteAccount(c *fiber.Ctx) error {
	userID := c.Locals("userID").(uint)

	if err := h.AuthService.DeleteAccount(userID); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"message": "Account deleted successfully",
	})
}

// ValidateToken validates if the current token is still valid.
func (h *AuthHandler) ValidateToken(c *fiber.Ctx) error {
	// If we reach this point, the JWT middleware has already validated the token
	userID := c.Locals("userID").(uint)

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"message": "Token is valid",
		"user_id": userID,
	})
}

// VerifyEmail handles email verification requests.
func (h *AuthHandler) VerifyEmail(c *fiber.Ctx) error {
	var req schemas.EmailVerificationRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	if err := h.EmailService.VerifyEmail(req.Token); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"message": "E-Mail erfolgreich verifiziert",
	})
}

// ResendVerificationEmail handles requests to resend verification emails.
func (h *AuthHandler) ResendVerificationEmail(c *fiber.Ctx) error {
	var req schemas.ResendVerificationRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	if err := h.EmailService.ResendVerificationEmail(req.Email); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"message": "Verifizierungs-E-Mail wurde erneut gesendet",
	})
}
