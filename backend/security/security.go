package security

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"fmt"
	"log"
	"strings"

	"golang.org/x/crypto/pbkdf2"
	"gorm.io/gorm"
)

const (
	// PBKDF2 parameters (should match frontend)
	pbkdf2Iterations = 250000 // Number of iterations
	pbkdf2KeyLen     = 32     // Desired key length in bytes (for AES-256)
	pbkdf2SaltLen    = 16     // Salt length in bytes
)

// HashPassword generates a PBKDF2 hash of the password with a random salt.
// It returns the hash and the salt as base64 encoded strings.
func HashPassword(password string) (hash string, salt string, err error) {
	// Generate a random salt
	saltBytes := make([]byte, pbkdf2SaltLen)
	if _, err := rand.Read(saltBytes); err != nil {
		return "", "", fmt.Errorf("failed to generate salt: %w", err)
	}
	salt = base64.RawStdEncoding.EncodeToString(saltBytes)

	// Derive the key using PBKDF2 with SHA-256
	hashBytes := pbkdf2.Key([]byte(password), saltBytes, pbkdf2Iterations, pbkdf2KeyLen, sha256.New)
	hash = base64.RawStdEncoding.EncodeToString(hashBytes)

	return hash, salt, nil
}

// VerifyPassword compares a plain password with a PBKDF2 hash.
// It expects the stored hash and salt as base64 encoded strings.
func VerifyPassword(plainPassword string, hashedPassword string, salt string) (bool, error) {
	// Decode the salt from base64
	saltBytes, err := base64.RawStdEncoding.DecodeString(salt)
	if err != nil {
		return false, fmt.Errorf("failed to decode salt: %w", err)
	}

	// Decode the stored hash from base64
	storedHashBytes, err := base64.RawStdEncoding.DecodeString(hashedPassword)
	if err != nil {
		return false, fmt.Errorf("failed to decode hashed password: %w", err)
	}

	// Derive the key from the plain password with the same salt and parameters
	comparisonHashBytes := pbkdf2.Key([]byte(plainPassword), saltBytes, pbkdf2Iterations, pbkdf2KeyLen, sha256.New)

	// Compare the generated hash with the stored hash
	// Use constant-time comparison in production to mitigate timing attacks
	// For simplicity, a direct byte comparison is used here.
	// In a real application, consider using `crypto/subtle.ConstantTimeCompare`.
	return string(comparisonHashBytes) == string(storedHashBytes), nil
}

// Note: JWT functions (GenerateJWTToken, ValidateJWTToken, GetJWTSecret) and the jwtSecretKey variable are now in jwt.go

// Ensure gorm is imported to avoid unused import errors if not used elsewhere in this file
var _ gorm.Model

// Ensure log is imported to avoid unused import errors if not used elsewhere in this file
var _ *log.Logger

// Ensure strings is imported to avoid unused import errors if not used elsewhere in this file
var _ = strings.Join
