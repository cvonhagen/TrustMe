package schemas

type PasswordBase struct {
	WebsiteURL        string `json:"website_url" binding:"required"`
	EncryptedUsername string `json:"encrypted_username" binding:"required"`
	UsernameIV        string `json:"username_iv" binding:"required"`
	UsernameTag       string `json:"username_tag" binding:"required"`
	EncryptedPassword string `json:"encrypted_password" binding:"required"`
	PasswordIV        string `json:"password_iv" binding:"required"`
	PasswordTag       string `json:"password_tag" binding:"required"`
	EncryptedNotes    string `json:"encrypted_notes,omitempty"`
	NotesIV           string `json:"notes_iv,omitempty"`
	NotesTag          string `json:"notes_tag,omitempty"`
}

type PasswordCreate struct {
	PasswordBase
}

type PasswordResponse struct {
	ID     uint `json:"id"`
	UserID uint `json:"user_id"`
	PasswordBase
	CreatedAt string `json:"created_at"`
	UpdatedAt string `json:"updated_at"`
}
