package models

import (
	"time"
)

// User repräsentiert das Benutzerprofil in der Datenbank.
type User struct {
	ID                   uint       `gorm:"primaryKey"`           // Eindeutige ID des Benutzers
	Username             string     `gorm:"uniqueIndex;not null"` // Benutzername, muss eindeutig sein und darf nicht null sein
	Email                string     `gorm:"uniqueIndex;not null"` // E-Mail-Adresse, muss eindeutig sein und darf nicht null sein
	EmailVerified        bool       `gorm:"default:false"`        // Flag, ob die E-Mail-Adresse verifiziert ist
	EmailVerificationToken string   `gorm:"type:text"`            // Token für die E-Mail-Verifizierung
	EmailTokenExpiry     *time.Time // Ablaufzeit des E-Mail-Verifizierungstokens
	HashedMasterPassword string     `gorm:"type:text;not null"`   // Gehashtes Master-Passwort des Benutzers
	Salt                 string     `gorm:"type:text;not null"`   // Salt für das Hashing des Master-Passworts
	TwoFAEnabled         bool       `gorm:"default:false"`        // Flag, ob die Zwei-Faktor-Authentifizierung aktiviert ist
	TwoFASecret          string     `gorm:"type:text"`            // Geheimnis für die Zwei-Faktor-Authentifizierung (nullable)
	CreatedAt            time.Time  // Zeitstempel der Erstellung des Benutzers
	UpdatedAt            time.Time  // Zeitstempel der letzten Aktualisierung des Benutzers
	Passwords            []Password `gorm:"foreignKey:UserID"` // Verknüpfung zu den Passwörtern des Benutzers (One-to-Many)
}

// Password repräsentiert einen gespeicherten Passwort-Eintrag in der Datenbank.
type Password struct {
	ID                uint      `gorm:"primaryKey"`         // Eindeutige ID des Passwort-Eintrags
	UserID            uint      `gorm:"index"`              // Fremdschlüssel zur Benutzer-ID
	WebsiteURL        string    `gorm:"type:text;not null"` // URL der Website, zu der das Passwort gehört
	EncryptedUsername string    `gorm:"type:text;not null"` // Verschlüsselter Benutzername für die Website
	UsernameIV        string    `gorm:"type:text;not null"` // Initialisierungsvektor für den Benutzernamen
	UsernameTag       string    `gorm:"type:text;not null"` // Authentifizierungs-Tag für den Benutzernamen (für GCM)
	EncryptedPassword string    `gorm:"type:text;not null"` // Verschlüsseltes Passwort (als String)
	PasswordIV        string    `gorm:"type:text;not null"` // Initialisierungsvektor für das Passwort
	PasswordTag       string    `gorm:"type:text;not null"` // Authentifizierungs-Tag für das Passwort (für GCM)
	EncryptedNotes    string    `gorm:"type:text"`          // Verschlüsselte Notizen (nullable)
	NotesIV           string    `gorm:"type:text"`          // Initialisierungsvektor für Notizen (nullable)
	NotesTag          string    `gorm:"type:text"`          // Authentifizierungs-Tag für Notizen (nullable)
	CreatedAt         time.Time // Zeitstempel der Erstellung des Passwort-Eintrags
	UpdatedAt         time.Time // Zeitstempel der letzten Aktualisierung des Passwort-Eintrags
	Owner             User      `gorm:"foreignKey:UserID"` // Beziehung zurück zum Benutzer (gehört zu)
}
