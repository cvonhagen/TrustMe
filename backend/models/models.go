package models

import (
	"time"
)

type User struct {
	ID                   uint   `gorm:"primaryKey"`
	Username             string `gorm:"uniqueIndex;not null"`
	Email                string `gorm:"uniqueIndex;not null"`
	HashedMasterPassword string `gorm:"type:text;not null"`
	Salt                 string `gorm:"type:text;not null"`
	TwoFAEnabled         bool   `gorm:"default:false"`
	TwoFASecret          string `gorm:"type:text"` // nullable
	CreatedAt            time.Time
	UpdatedAt            time.Time
	Passwords            []Password `gorm:"foreignKey:UserID"` // Relationship
}

type Password struct {
	ID                uint   `gorm:"primaryKey"`
	UserID            uint   `gorm:"index"` // ForeignKey reference
	WebsiteURL        string `gorm:"type:text;not null"`
	EncryptedUsername string `gorm:"type:text;not null"`
	UsernameIV        string `gorm:"type:text;not null"`
	UsernameTag       string `gorm:"type:text;not null"`
	EncryptedPassword []byte `gorm:"type:bytea;not null"` // Use bytea for LargeBinary
	PasswordIV        string `gorm:"type:text;not null"`
	PasswordTag       string `gorm:"type:text;not null"`
	EncryptedNotes    string `gorm:"type:text"` // nullable
	NotesIV           string `gorm:"type:text"` // nullable
	NotesTag          string `gorm:"type:text"` // nullable
	CreatedAt         time.Time
	UpdatedAt         time.Time
	Owner             User `gorm:"foreignKey:UserID"` // Relationship back to User
}
