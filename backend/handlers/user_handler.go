package handlers

import (
	"backend/schemas"
	"backend/services"

	"github.com/gofiber/fiber/v2"
)

// UserHandler handles user related requests.
type UserHandler struct {
	UserService *services.UserService
}

// NewUserHandler creates a new UserHandler instance.
func NewUserHandler(userService *services.UserService) *UserHandler {
	return &UserHandler{UserService: userService}
}

// GetProfile handles requests to get the authenticated user's profile.
func (h *UserHandler) GetProfile(c *fiber.Ctx) error {
	userID := c.Locals("userID").(uint)

	user, err := h.UserService.GetUserByID(userID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to retrieve user profile"})
	}

	return c.Status(fiber.StatusOK).JSON(schemas.UserProfileResponse{
		ID:           user.ID,
		Username:     user.Username,
		Email:        user.Email,
		CreatedAt:    user.CreatedAt,
		UpdatedAt:    user.UpdatedAt,
		TwoFAEnabled: user.TwoFAEnabled,
	})
}

// UpdateProfile handles requests to update the authenticated user's profile.
func (h *UserHandler) UpdateProfile(c *fiber.Ctx) error {
	userID := c.Locals("userID").(uint)
	var req schemas.UpdateProfileRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request body"})
	}

	updatedUser, err := h.UserService.UpdateUserProfile(userID, &req)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to update user profile"})
	}

	return c.Status(fiber.StatusOK).JSON(schemas.UserProfileResponse{
		ID:           updatedUser.ID,
		Username:     updatedUser.Username,
		Email:        updatedUser.Email,
		CreatedAt:    updatedUser.CreatedAt,
		UpdatedAt:    updatedUser.UpdatedAt,
		TwoFAEnabled: updatedUser.TwoFAEnabled,
	})
}

// DeleteAccount handles requests to schedule the authenticated user's account for deletion.
// The account will be deleted after 30 days, during which it can be restored.
func (h *UserHandler) DeleteAccount(c *fiber.Ctx) error {
	userID := c.Locals("userID").(uint)

	if err := h.UserService.ScheduleAccountDeletion(userID); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to schedule account deletion"})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"message": "Account wurde für Löschung markiert. Ihre Daten werden noch 30 Tage sicher gespeichert und können bis dahin wiederhergestellt werden. Nach 30 Tagen werden alle Daten endgültig gelöscht.",
		"deletion_date": "In 30 Tagen",
		"can_restore": true,
	})
}

// RestoreAccount handles requests to restore a scheduled-for-deletion account.
func (h *UserHandler) RestoreAccount(c *fiber.Ctx) error {
	userID := c.Locals("userID").(uint)

	if err := h.UserService.RestoreAccount(userID); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{"message": "Account wurde erfolgreich wiederhergestellt"})
}
