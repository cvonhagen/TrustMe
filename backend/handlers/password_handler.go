package handlers

import (
	"backend/models"
	"backend/schemas"
	"backend/services"
	"encoding/base64"
	"errors"
	"strconv"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

// PasswordHandler handles password related requests.
type PasswordHandler struct {
	PasswordService *services.PasswordService
	UserService     *services.UserService // Needed to potentially get user info for context
}

// NewPasswordHandler creates a new PasswordHandler instance.
func NewPasswordHandler(passwordService *services.PasswordService, userService *services.UserService) *PasswordHandler {
	return &PasswordHandler{PasswordService: passwordService, UserService: userService}
}

// CreatePassword handles creating a new password entry.
func (h *PasswordHandler) CreatePassword(c *fiber.Ctx) error {
	userID := c.Locals("userID").(uint)

	var req schemas.PasswordCreate
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	password := &models.Password{
		UserID:            userID,
		WebsiteURL:        req.WebsiteURL,
		EncryptedUsername: req.EncryptedUsername,
		UsernameIV:        req.UsernameIV,
		UsernameTag:       req.UsernameTag,
		// Assuming EncryptedPassword from schema is base64 encoded string
		// EncryptedPassword: []byte(req.EncryptedPassword), // Will need base64 decode
		PasswordIV:     req.PasswordIV,
		PasswordTag:    req.PasswordTag,
		EncryptedNotes: req.EncryptedNotes,
		NotesIV:        req.NotesIV,
		NotesTag:       req.NotesTag,
	}

	// Decode base64 encoded fields
	var err error
	if password.EncryptedPassword, err = base64.RawStdEncoding.DecodeString(req.EncryptedPassword); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid EncryptedPassword encoding"})
	}

	if err := h.PasswordService.CreatePassword(password); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to create password entry",
		})
	}

	response := schemas.PasswordResponse{
		ID:     password.ID,
		UserID: password.UserID,
		PasswordBase: schemas.PasswordBase{
			WebsiteURL:        password.WebsiteURL,
			EncryptedUsername: password.EncryptedUsername,
			UsernameIV:        password.UsernameIV,
			UsernameTag:       password.UsernameTag,
			// Encode back to base64 for response if needed, or send as string if client expects it
			EncryptedPassword: base64.RawStdEncoding.EncodeToString(password.EncryptedPassword), // Encode back to base64 for response
			PasswordIV:        password.PasswordIV,
			PasswordTag:       password.PasswordTag,
			EncryptedNotes:    password.EncryptedNotes,
			NotesIV:           password.NotesIV,
			NotesTag:          password.NotesTag,
		},
		CreatedAt: password.CreatedAt.String(),
		UpdatedAt: password.UpdatedAt.String(),
	}

	return c.Status(fiber.StatusCreated).JSON(response)
}

// GetPasswords handles retrieving all password entries for the authenticated user.
func (h *PasswordHandler) GetPasswords(c *fiber.Ctx) error {
	userID := c.Locals("userID").(uint)

	passwords, err := h.PasswordService.GetPasswordsByUserID(userID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to retrieve password entries",
		})
	}

	// Convert models to response schemas
	response := []schemas.PasswordResponse{}
	for _, password := range passwords {
		response = append(response, schemas.PasswordResponse{
			ID:     password.ID,
			UserID: password.UserID,
			PasswordBase: schemas.PasswordBase{
				WebsiteURL:        password.WebsiteURL,
				EncryptedUsername: password.EncryptedUsername,
				UsernameIV:        password.UsernameIV,
				UsernameTag:       password.UsernameTag,
				EncryptedPassword: base64.RawStdEncoding.EncodeToString(password.EncryptedPassword), // Encode back to base64
				PasswordIV:        password.PasswordIV,
				PasswordTag:       password.PasswordTag,
				EncryptedNotes:    password.EncryptedNotes,
				NotesIV:           password.NotesIV,
				NotesTag:          password.NotesTag,
			},
			CreatedAt: password.CreatedAt.String(),
			UpdatedAt: password.UpdatedAt.String(),
		})
	}

	return c.Status(fiber.StatusOK).JSON(response)
}

// GetPassword handles retrieving a single password entry by ID.
func (h *PasswordHandler) GetPassword(c *fiber.Ctx) error {
	userID := c.Locals("userID").(uint)
	passwordIDStr := c.Params("id")

	passwordID, err := strconv.ParseUint(passwordIDStr, 10, 64)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid password ID",
		})
	}

	password, err := h.PasswordService.GetPasswordByID(uint(passwordID), userID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "Password entry not found",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to retrieve password entry",
		})
	}

	response := schemas.PasswordResponse{
		ID:     password.ID,
		UserID: password.UserID,
		PasswordBase: schemas.PasswordBase{
			WebsiteURL:        password.WebsiteURL,
			EncryptedUsername: password.EncryptedUsername,
			UsernameIV:        password.UsernameIV,
			UsernameTag:       password.UsernameTag,
			EncryptedPassword: base64.RawStdEncoding.EncodeToString(password.EncryptedPassword), // Encode back to base64
			PasswordIV:        password.PasswordIV,
			PasswordTag:       password.PasswordTag,
			EncryptedNotes:    password.EncryptedNotes,
			NotesIV:           password.NotesIV,
			NotesTag:          password.NotesTag,
		},
		CreatedAt: password.CreatedAt.String(),
		UpdatedAt: password.UpdatedAt.String(),
	}

	return c.Status(fiber.StatusOK).JSON(response)
}

// UpdatePassword handles updating an existing password entry.
func (h *PasswordHandler) UpdatePassword(c *fiber.Ctx) error {
	userID := c.Locals("userID").(uint)
	passwordIDStr := c.Params("id")

	passwordID, err := strconv.ParseUint(passwordIDStr, 10, 64)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid password ID",
		})
	}

	var req schemas.PasswordBase // Use PasswordBase for update request
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	// Get the existing password entry
	password, err := h.PasswordService.GetPasswordByID(uint(passwordID), userID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "Password entry not found",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to retrieve password entry",
		})
	}

	// Update fields from the request
	password.WebsiteURL = req.WebsiteURL
	password.EncryptedUsername = req.EncryptedUsername
	password.UsernameIV = req.UsernameIV
	password.UsernameTag = req.UsernameTag
	// Decode base64 encoded password
	if password.EncryptedPassword, err = base64.RawStdEncoding.DecodeString(req.EncryptedPassword); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid EncryptedPassword encoding"})
	}
	password.PasswordIV = req.PasswordIV
	password.PasswordTag = req.PasswordTag
	password.EncryptedNotes = req.EncryptedNotes
	password.NotesIV = req.NotesIV
	password.NotesTag = req.NotesTag

	// Save the updated entry
	if err := h.PasswordService.UpdatePassword(password); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to update password entry",
		})
	}

	response := schemas.PasswordResponse{
		ID:     password.ID,
		UserID: password.UserID,
		PasswordBase: schemas.PasswordBase{
			WebsiteURL:        password.WebsiteURL,
			EncryptedUsername: password.EncryptedUsername,
			UsernameIV:        password.UsernameIV,
			UsernameTag:       password.UsernameTag,
			EncryptedPassword: base64.RawStdEncoding.EncodeToString(password.EncryptedPassword), // Encode back to base64
			PasswordIV:        password.PasswordIV,
			PasswordTag:       password.PasswordTag,
			EncryptedNotes:    password.EncryptedNotes,
			NotesIV:           password.NotesIV,
			NotesTag:          password.NotesTag,
		},
		CreatedAt: password.CreatedAt.String(),
		UpdatedAt: password.UpdatedAt.String(),
	}

	return c.Status(fiber.StatusOK).JSON(response)
}

// DeletePassword handles deleting a password entry by ID.
func (h *PasswordHandler) DeletePassword(c *fiber.Ctx) error {
	userID := c.Locals("userID").(uint)
	passwordIDStr := c.Params("id")

	passwordID, err := strconv.ParseUint(passwordIDStr, 10, 64)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid password ID",
		})
	}

	if err := h.PasswordService.DeletePassword(uint(passwordID), userID); err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "Password entry not found",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to delete password entry",
		})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"message": "Password entry deleted successfully",
	})
}
