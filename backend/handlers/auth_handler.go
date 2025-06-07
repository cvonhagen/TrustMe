package handlers

import (
	"backend/schemas"
	"backend/services"

	"log"

	"github.com/gofiber/fiber/v2"
)

// AuthHandler handles authentication related requests.
type AuthHandler struct {
	AuthService *services.AuthService
}

// NewAuthHandler creates a new AuthHandler instance.
func NewAuthHandler(authService *services.AuthService) *AuthHandler {
	return &AuthHandler{AuthService: authService}
}

// Register handles user registration requests.
func (h *AuthHandler) Register(c *fiber.Ctx) error {
	var req schemas.RegisterRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	if err := h.AuthService.RegisterUser(&req); err != nil {
		// More specific error handling could be added here based on the error type
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"message": "User registered successfully",
	})
}

// Login handles user login requests.
func (h *AuthHandler) Login(c *fiber.Ctx) error {
	// Temporärer Test: Sofort eine statische 200 OK Antwort zurückgeben
	// log.Println("AuthHandler.Login: Sending static 200 OK for testing.") // Debugging
	// return c.Status(fiber.StatusOK).JSON(fiber.Map{"message": "Static OK response for testing"})

	// Originaler Code (auskommentiert):

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

	log.Printf("AuthHandler.Login: AuthService.LoginUser returned success for user %s. Sending OK response.", req.Username) // Debugging vor erfolgreicher Antwort
	return c.Status(fiber.StatusOK).JSON(loginRes)
}

// Logout handles user logout requests.
func (h *AuthHandler) Logout(c *fiber.Ctx) error {
	// Invalidate the token or session on the server-side if applicable.
	// For JWT, invalidation often happens on the client by discarding the token.
	// If a server-side session or token blacklist is used, implement that here.
	log.Println("AuthHandler.Logout: User logged out.")
	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"message": "Successfully logged out",
	})
}
