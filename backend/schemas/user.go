package schemas

import "time"

// UserProfileResponse defines the structure for retrieving a user's profile.
type UserProfileResponse struct {
	ID           uint      `json:"id"`
	Username     string    `json:"username"`
	Email        string    `json:"email"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
	TwoFAEnabled bool      `json:"two_fa_enabled"`
}

// UpdateProfileRequest defines the structure for updating a user's profile.
type UpdateProfileRequest struct {
	Username *string `json:"username,omitempty"`
	Email    *string `json:"email,omitempty"`
	Password *string `json:"password,omitempty"` // Only for password change
}
