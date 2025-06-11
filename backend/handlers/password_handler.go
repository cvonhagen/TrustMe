package handlers

import (
	"backend/schemas"
	"backend/services"
	"errors"
	"strconv"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

// PasswordHandler behandelt passwortbezogene Anfragen.
type PasswordHandler struct {
	PasswordService *services.PasswordService // Dienst für Passwortoperationen
	UserService     *services.UserService     // Dienst für Benutzeroperationen, falls benötigt
}

// NewPasswordHandler erstellt eine neue PasswordHandler-Instanz.
func NewPasswordHandler(passwordService *services.PasswordService, userService *services.UserService) *PasswordHandler {
	return &PasswordHandler{PasswordService: passwordService, UserService: userService}
}

// CreatePassword verarbeitet die Erstellung eines neuen Passwort-Eintrags.
func (h *PasswordHandler) CreatePassword(c *fiber.Ctx) error {
	// Benutzer-ID aus dem Kontext abrufen
	userID := c.Locals("userID").(uint)

	var req schemas.CreatePasswordRequest
	// Anfragekörper parsen
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Ungültiger Anfragekörper",
		})
	}

	// Passwort-Dienst aufrufen, um das Passwort zu erstellen
	password, err := h.PasswordService.CreatePassword(userID, &req)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Fehler beim Erstellen des Passwort-Eintrags",
		})
	}

	// Antwort erstellen
	response := schemas.PasswordResponse{
		ID:                password.ID,
		UserID:            password.UserID,
		WebsiteURL:        password.WebsiteURL,
		EncryptedUsername: password.EncryptedUsername,
		UsernameIV:        password.UsernameIV,
		UsernameTag:       password.UsernameTag,
		EncryptedPassword: password.EncryptedPassword,
		PasswordIV:        password.PasswordIV,
		PasswordTag:       password.PasswordTag,
		EncryptedNotes:    password.EncryptedNotes,
		NotesIV:           password.NotesIV,
		NotesTag:          password.NotesTag,
		CreatedAt:         password.CreatedAt,
		UpdatedAt:         password.UpdatedAt,
	}

	return c.Status(fiber.StatusCreated).JSON(response)
}

// BatchCreatePasswords verarbeitet die Erstellung mehrerer Passwort-Einträge in einem Batch.
func (h *PasswordHandler) BatchCreatePasswords(c *fiber.Ctx) error {
	// Benutzer-ID aus dem Kontext abrufen
	userID := c.Locals("userID").(uint)

	var req schemas.BatchCreatePasswordRequest
	// Anfragekörper parsen
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Ungültiger Anfragekörper für Batch-Erstellung",
		})
	}

	// Batch-Passwörter über den Dienst erstellen
	passwords, err := h.PasswordService.BatchCreatePasswords(userID, &req)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Fehler beim Batch-Erstellen der Passwörter",
		})
	}

	// Modelle in Antwort-Schemata konvertieren
	response := []schemas.PasswordResponse{}
	for _, password := range passwords {
		response = append(response, schemas.PasswordResponse{
			ID:                password.ID,
			UserID:            password.UserID,
			WebsiteURL:        password.WebsiteURL,
			EncryptedUsername: password.EncryptedUsername,
			UsernameIV:        password.UsernameIV,
			UsernameTag:       password.UsernameTag,
			EncryptedPassword: password.EncryptedPassword,
			PasswordIV:        password.PasswordIV,
			PasswordTag:       password.PasswordTag,
			EncryptedNotes:    password.EncryptedNotes,
			NotesIV:           password.NotesIV,
			NotesTag:          password.NotesTag,
			CreatedAt:         password.CreatedAt,
			UpdatedAt:         password.UpdatedAt,
		})
	}

	return c.Status(fiber.StatusCreated).JSON(response)
}

// GetPasswords verarbeitet das Abrufen aller Passwort-Einträge für den authentifizierten Benutzer.
func (h *PasswordHandler) GetPasswords(c *fiber.Ctx) error {
	// Benutzer-ID aus dem Kontext abrufen
	userID := c.Locals("userID").(uint)

	// Passwörter über den Dienst abrufen
	passwords, err := h.PasswordService.GetPasswordsByUserID(userID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Fehler beim Abrufen der Passwort-Einträge",
		})
	}

	// Modelle in Antwort-Schemata konvertieren
	response := []schemas.PasswordResponse{}
	for _, password := range passwords {
		response = append(response, schemas.PasswordResponse{
			ID:                password.ID,
			UserID:            password.UserID,
			WebsiteURL:        password.WebsiteURL,
			EncryptedUsername: password.EncryptedUsername,
			UsernameIV:        password.UsernameIV,
			UsernameTag:       password.UsernameTag,
			EncryptedPassword: password.EncryptedPassword,
			PasswordIV:        password.PasswordIV,
			PasswordTag:       password.PasswordTag,
			EncryptedNotes:    password.EncryptedNotes,
			NotesIV:           password.NotesIV,
			NotesTag:          password.NotesTag,
			CreatedAt:         password.CreatedAt,
			UpdatedAt:         password.UpdatedAt,
		})
	}

	return c.Status(fiber.StatusOK).JSON(response)
}

// GetPassword verarbeitet das Abrufen eines einzelnen Passwort-Eintrags nach ID.
func (h *PasswordHandler) GetPassword(c *fiber.Ctx) error {
	// Benutzer-ID aus dem Kontext abrufen
	userID := c.Locals("userID").(uint)
	// Passwort-ID aus den Parametern abrufen
	passwordIDStr := c.Params("id")

	// Passwort-ID in uint64 konvertieren
	passwordID, err := strconv.ParseUint(passwordIDStr, 10, 64)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Ungültige Passwort-ID",
		})
	}

	// Passwort über den Dienst abrufen
	password, err := h.PasswordService.GetPasswordByID(uint(passwordID), userID)
	if err != nil {
		// Fehlerbehandlung für nicht gefundenen Eintrag
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "Passwort-Eintrag nicht gefunden",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Fehler beim Abrufen des Passwort-Eintrags",
		})
	}

	// Antwort erstellen
	response := schemas.PasswordResponse{
		ID:                password.ID,
		UserID:            password.UserID,
		WebsiteURL:        password.WebsiteURL,
		EncryptedUsername: password.EncryptedUsername,
		UsernameIV:        password.UsernameIV,
		UsernameTag:       password.UsernameTag,
		EncryptedPassword: password.EncryptedPassword,
		PasswordIV:        password.PasswordIV,
		PasswordTag:       password.PasswordTag,
		EncryptedNotes:    password.EncryptedNotes,
		NotesIV:           password.NotesIV,
		NotesTag:          password.NotesTag,
		CreatedAt:         password.CreatedAt,
		UpdatedAt:         password.UpdatedAt,
	}

	return c.Status(fiber.StatusOK).JSON(response)
}

// UpdatePassword verarbeitet die Aktualisierung eines bestehenden Passwort-Eintrags.
func (h *PasswordHandler) UpdatePassword(c *fiber.Ctx) error {
	// Benutzer-ID aus dem Kontext abrufen
	userID := c.Locals("userID").(uint)
	// Passwort-ID aus den Parametern abrufen
	passwordIDStr := c.Params("id")

	// Passwort-ID in uint64 konvertieren
	passwordID, err := strconv.ParseUint(passwordIDStr, 10, 64)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Ungültige Passwort-ID",
		})
	}

	var req schemas.UpdatePasswordRequest
	// Anfragekörper parsen
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Ungültiger Anfragekörper",
		})
	}

	// Passwort über den Dienst aktualisieren
	updatedPassword, err := h.PasswordService.UpdatePassword(uint(passwordID), userID, &req)
	if err != nil {
		// Fehlerbehandlung für nicht gefundenen Eintrag
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "Passwort-Eintrag nicht gefunden",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Fehler beim Aktualisieren des Passwort-Eintrags",
		})
	}

	// Antwort erstellen
	response := schemas.PasswordResponse{
		ID:                updatedPassword.ID,
		UserID:            updatedPassword.UserID,
		WebsiteURL:        updatedPassword.WebsiteURL,
		EncryptedUsername: updatedPassword.EncryptedUsername,
		UsernameIV:        updatedPassword.UsernameIV,
		UsernameTag:       updatedPassword.UsernameTag,
		EncryptedPassword: updatedPassword.EncryptedPassword,
		PasswordIV:        updatedPassword.PasswordIV,
		PasswordTag:       updatedPassword.PasswordTag,
		EncryptedNotes:    updatedPassword.EncryptedNotes,
		NotesIV:           updatedPassword.NotesIV,
		NotesTag:          updatedPassword.NotesTag,
		CreatedAt:         updatedPassword.CreatedAt,
		UpdatedAt:         updatedPassword.UpdatedAt,
	}

	return c.Status(fiber.StatusOK).JSON(response)
}

// DeletePassword verarbeitet das Löschen eines Passwort-Eintrags.
func (h *PasswordHandler) DeletePassword(c *fiber.Ctx) error {
	// Benutzer-ID aus dem Kontext abrufen
	userID := c.Locals("userID").(uint)
	// Passwort-ID aus den Parametern abrufen
	passwordIDStr := c.Params("id")

	// Passwort-ID in uint64 konvertieren
	passwordID, err := strconv.ParseUint(passwordIDStr, 10, 64)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Ungültige Passwort-ID",
		})
	}

	// Passwort über den Dienst löschen
	if err := h.PasswordService.DeletePassword(uint(passwordID), userID); err != nil {
		// Fehlerbehandlung für nicht gefundenen Eintrag
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "Passwort-Eintrag nicht gefunden",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Fehler beim Löschen des Passwort-Eintrags",
		})
	}

	return c.Status(fiber.StatusNoContent).Send(nil)
}
