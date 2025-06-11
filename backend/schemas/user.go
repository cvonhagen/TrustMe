package schemas

import "time"

// UserProfileResponse definiert die Struktur für die Antwort beim Abrufen eines Benutzerprofils.
type UserProfileResponse struct {
	ID           uint      `json:"id"`             // Eindeutige ID des Benutzers
	Username     string    `json:"username"`       // Benutzername
	Email        string    `json:"email"`          // E-Mail-Adresse
	CreatedAt    time.Time `json:"created_at"`     // Erstellungszeitpunkt des Benutzers
	UpdatedAt    time.Time `json:"updated_at"`     // Letzter Aktualisierungszeitpunkt des Benutzers
	TwoFAEnabled bool      `json:"two_fa_enabled"` // Gibt an, ob 2FA aktiviert ist
}

// UpdateProfileRequest definiert die Struktur der Anfrage zum Aktualisieren eines Benutzerprofils.
type UpdateProfileRequest struct {
	Username *string `json:"username,omitempty"` // Optionaler neuer Benutzername
	Email    *string `json:"email,omitempty"`    // Optionale neue E-Mail-Adresse
	Password *string `json:"password,omitempty"` // Optionales neues Passwort (nur für Passwortänderung)
}
