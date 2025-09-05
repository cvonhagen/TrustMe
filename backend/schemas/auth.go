package schemas

// RegisterRequest definiert die Struktur der Anfrage für die Benutzerregistrierung.
type RegisterRequest struct {
	Username       string `json:"username" binding:"required"`        // Benutzername, muss eindeutig sein
	Email          string `json:"email" binding:"required,email"`     // E-Mail-Adresse, muss gültig sein
	MasterPassword string `json:"master_password" binding:"required"` // Master-Passwort des Benutzers
}

// LoginRequest definiert die Struktur der Anfrage für die Benutzeranmeldung.
type LoginRequest struct {
	Username       string `json:"username" binding:"required"`        // Benutzername
	MasterPassword string `json:"master_password" binding:"required"` // Master-Passwort
}

// LoginResponse definiert die Struktur der Antwort nach einer erfolgreichen Anmeldung.
type LoginResponse struct {
	Token        string `json:"token"`          // JWT-Authentifizierungstoken
	UserID       uint   `json:"user_id"`        // ID des angemeldeten Benutzers
	Username     string `json:"username"`       // Benutzername des angemeldeten Benutzers
	TwoFAEnabled bool   `json:"two_fa_enabled"` // Gibt an, ob 2FA für diesen Benutzer aktiviert ist
	Salt         string `json:"salt"`           // Salt, der für die Ableitung des Verschlüsselungsschlüssels verwendet wird
}

// TwoFactorSetupRequest definiert die Struktur für die Anfrage zur Einrichtung der Zwei-Faktor-Authentifizierung.
type TwoFactorSetupRequest struct {
	Code string `json:"code" binding:"required"` // Der vom Benutzer generierte 2FA-Code
}

// TwoFactorVerifyRequest definiert die Struktur für die Anfrage zur Verifizierung der Zwei-Faktor-Authentifizierung während des Logins.
type TwoFactorVerifyRequest struct {
	Username string `json:"username" binding:"required"` // Benutzername
	Code     string `json:"code" binding:"required"`     // Der vom Benutzer generierte 2FA-Code
}

// TwoFALoginResponse repräsentiert die Antwort nach erfolgreicher 2FA-Verifizierung
type TwoFALoginResponse struct {
	Token string `json:"token"`
	Salt  string `json:"salt"`
}
