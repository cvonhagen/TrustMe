package schemas

import "time"

// CreatePasswordRequest definiert die Struktur der Anfrage zum Erstellen eines neuen Passwort-Eintrags.
type CreatePasswordRequest struct {
	WebsiteURL        string `json:"website_url" binding:"required"`        // URL der Website
	EncryptedUsername string `json:"encrypted_username" binding:"required"` // Verschlüsselter Benutzername
	UsernameIV        string `json:"username_iv" binding:"required"`        // Initialisierungsvektor für Benutzername
	UsernameTag       string `json:"username_tag" binding:"required"`       // Authentifizierungs-Tag für Benutzername
	EncryptedPassword string `json:"encrypted_password" binding:"required"` // Verschlüsseltes Passwort (String)
	PasswordIV        string `json:"password_iv" binding:"required"`        // Initialisierungsvektor für Passwort
	PasswordTag       string `json:"password_tag" binding:"required"`       // Authentifizierungs-Tag für Passwort
	EncryptedNotes    string `json:"encrypted_notes"`                       // Verschlüsselte Notizen (optional)
	NotesIV           string `json:"notes_iv"`                              // Initialisierungsvektor für Notizen (optional)
	NotesTag          string `json:"notes_tag"`                             // Authentifizierungs-Tag für Notizen (optional)
}

// BatchCreatePasswordRequest definiert die Struktur für die Batch-Erstellung mehrerer Passwörter.
type BatchCreatePasswordRequest struct {
	Passwords []CreatePasswordRequest `json:"passwords" binding:"required,min=1"` // Liste der Passwortanfragen
}

// UpdatePasswordRequest definiert die Struktur der Anfrage zum Aktualisieren eines bestehenden Passwort-Eintrags.
// Alle Felder sind optional, um Teilaktualisierungen zu ermöglichen.
type UpdatePasswordRequest struct {
	WebsiteURL        *string `json:"website_url,omitempty"`        // Optionale URL der Website
	EncryptedUsername *string `json:"encrypted_username,omitempty"` // Optional verschlüsselter Benutzername
	UsernameIV        *string `json:"username_iv,omitempty"`        // Optionaler IV für Benutzername
	UsernameTag       *string `json:"username_tag,omitempty"`       // Optionaler Tag für Benutzername
	EncryptedPassword *string `json:"encrypted_password,omitempty"` // Optional verschlüsseltes Passwort
	PasswordIV        *string `json:"password_iv,omitempty"`        // Optionaler IV für Passwort
	PasswordTag       *string `json:"password_tag,omitempty"`       // Optionaler Tag für Passwort
	EncryptedNotes    *string `json:"encrypted_notes,omitempty"`    // Optional verschlüsselte Notizen
	NotesIV           *string `json:"notes_iv,omitempty"`           // Optionaler IV für Notizen
	NotesTag          *string `json:"notes_tag,omitempty"`          // Optionaler Tag für Notizen
}

// PasswordResponse definiert die Struktur der Antwort für einen Passwort-Eintrag.
// Verschlüsselte Felder werden hier als Base64-Strings zurückgegeben.
type PasswordResponse struct {
	ID                uint      `json:"id"`                 // Eindeutige ID des Passwort-Eintrags
	UserID            uint      `json:"user_id"`            // ID des zugehörigen Benutzers
	WebsiteURL        string    `json:"website_url"`        // URL der Website
	EncryptedUsername string    `json:"encrypted_username"` // Verschlüsselter Benutzername (Base64)
	UsernameIV        string    `json:"username_iv"`        // IV für Benutzernamen (Base64)
	UsernameTag       string    `json:"username_tag"`       // Tag für Benutzernamen (Base64)
	EncryptedPassword string    `json:"encrypted_password"` // Verschlüsseltes Passwort (Base64)
	PasswordIV        string    `json:"password_iv"`        // IV für Passwort (Base64)
	PasswordTag       string    `json:"password_tag"`       // Tag für Passwort (Base64)
	EncryptedNotes    string    `json:"encrypted_notes"`    // Verschlüsselte Notizen (Base64, optional)
	NotesIV           string    `json:"notes_iv"`           // IV für Notizen (Base64, optional)
	NotesTag          string    `json:"notes_tag"`          // Tag für Notizen (Base64, optional)
	CreatedAt         time.Time `json:"created_at"`         // Erstellungszeitpunkt
	UpdatedAt         time.Time `json:"updated_at"`         // Letzter Aktualisierungszeitpunkt
}
