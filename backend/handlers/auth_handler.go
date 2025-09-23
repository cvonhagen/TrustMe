package handlers

import (
	"backend/models"
	"backend/schemas"
	"backend/services"
	"time"

	"github.com/gofiber/fiber/v2"
	"golang.org/x/crypto/bcrypt"
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
// Uses soft delete - account is marked for deletion but kept for 30 days.
func (h *AuthHandler) DeleteAccount(c *fiber.Ctx) error {
	userID := c.Locals("userID").(uint)

	if err := h.AuthService.ScheduleAccountDeletion(userID); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"message": "Account wurde für Löschung markiert. Ihre Daten werden noch 30 Tage sicher gespeichert und können bis dahin wiederhergestellt werden. Nach 30 Tagen werden alle Daten endgültig gelöscht.",
		"deletion_date": "In 30 Tagen",
		"can_restore": true,
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

// RestoreDeletedAccount handles public account restoration with username/password.
func (h *AuthHandler) RestoreDeletedAccount(c *fiber.Ctx) error {
	// Parse request body
	var req schemas.LoginRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	// Versuche den User zu finden (auch gelöschte)
	var user models.User
	result := h.AuthService.DB.Unscoped().Where("username = ?", req.Username).First(&user)
	if result.Error != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Ungültige Anmeldedaten",
		})
	}

	// Prüfe ob Account zur Löschung markiert ist
	if user.DeletedAt == nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Account ist nicht zur Löschung markiert",
		})
	}

	// Prüfe Passwort mit bcrypt (wie bei der Registrierung)
	err := bcrypt.CompareHashAndPassword([]byte(user.HashedMasterPassword), []byte(req.MasterPassword))
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Ungültiges Passwort",
		})
	}

	// Prüfe ob die 30 Tage noch nicht abgelaufen sind
	if user.DeletionScheduledAt != nil && time.Now().After(*user.DeletionScheduledAt) {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Wiederherstellungszeitraum ist abgelaufen",
		})
	}

	// Stelle Account wieder her
	user.DeletedAt = nil
	user.DeletionScheduledAt = nil
	if err := h.AuthService.DB.Save(&user).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Fehler bei der Wiederherstellung",
		})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"message": "Account wurde erfolgreich wiederhergestellt! Sie können sich jetzt wieder anmelden.",
	})
}
