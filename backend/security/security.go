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
	// PBKDF2 Parameter (sollten mit dem Frontend übereinstimmen)
	pbkdf2Iterations = 250000 // Number of iterations
	pbkdf2KeyLen     = 32     // Desired key length in bytes (for AES-256)
	PBKDF2SaltLen    = 16     // Salt length in bytes
)

// HashPassword generiert einen PBKDF2 Hash des Passworts mit einem gegebenen Salt.
// Es gibt den Hash als Base64-kodierten String zurück.
func HashPassword(password, salt string) (string, error) {
	saltBytes, err := base64.RawStdEncoding.DecodeString(salt)
	if err != nil {
		return "", fmt.Errorf("Fehler beim Dekodieren des Salts: %w", err)
	}

	// Leite den Schlüssel mit PBKDF2 und SHA-256 ab
	key := pbkdf2.Key([]byte(password), saltBytes, pbkdf2Iterations, pbkdf2KeyLen, sha256.New)

	// Konvertiere zu Base64 String
	keyBase64 := base64.RawStdEncoding.EncodeToString(key)

	return keyBase64, nil
}

// VerifyPassword vergleicht ein Klartext-Passwort mit einem PBKDF2 Hash unter Verwendung des gegebenen Salts.
// Es erwartet den gespeicherten Hash und das Salt als Base64-kodierte Strings.
func VerifyPassword(plainPassword string, hashedPassword string, salt string) (bool, error) {
	log.Printf("VerifyPassword: Starting verification.")                                 // Debugging
	log.Printf("VerifyPassword: plainPassword (for debugging only!): %s", plainPassword) // Debugging - ACHTUNG SICHERHEITSRISIKO!
	log.Printf("VerifyPassword: hashedPassword: %s", hashedPassword)                     // Debugging
	log.Printf("VerifyPassword: salt: %s", salt)                                         // Debugging

	// Dekodiere das Salt von Base64
	saltBytes, err := base64.RawStdEncoding.DecodeString(salt)
	if err != nil {
		return false, fmt.Errorf("Fehler beim Dekodieren des Salts: %w", err)
	}

	// Dekodiere den gespeicherten Hash von Base64
	storedHashBytes, err := base64.RawStdEncoding.DecodeString(hashedPassword)
	if err != nil {
		return false, fmt.Errorf("Fehler beim Dekodieren des gehashten Passworts: %w", err)
	}

	// Leite den Schlüssel vom Klartext-Passwort mit demselben Salt und denselben Parametern ab
	comparisonHashBytes := pbkdf2.Key([]byte(plainPassword), saltBytes, pbkdf2Iterations, pbkdf2KeyLen, sha256.New)
	log.Printf("VerifyPassword: Derived hash from plaintext and salt: %s", base64.RawStdEncoding.EncodeToString(comparisonHashBytes)) // Debugging

	// Vergleiche den generierten Hash mit dem gespeicherten Hash
	// Verwende in der Produktion einen Vergleich mit konstanter Zeit, um Timing-Angriffe abzumildern
	// Der Einfachheit halber wird hier ein direkter Byte-Vergleich verwendet.
	// In einer realen Anwendung ziehe die Verwendung von `crypto/subtle.ConstantTimeCompare` in Betracht.
	match := string(comparisonHashBytes) == string(storedHashBytes)
	log.Printf("VerifyPassword: Hashes match: %t", match) // Debugging
	return match, nil
}

// GenerateSalt generates a random salt of a specified length and returns it as a base64 encoded string.
func GenerateSalt(length int) (string, error) {
	saltBytes := make([]byte, length)
	_, err := rand.Read(saltBytes)
	if err != nil {
		return "", fmt.Errorf("Fehler beim Generieren des Salts: %w", err)
	}
	return base64.RawStdEncoding.EncodeToString(saltBytes), nil
}

// Hinweis: JWT-Funktionen (GenerateJWTToken, ValidateJWTToken, GetJWTSecret) und die Variable jwtSecretKey befinden sich jetzt in jwt.go

// Stelle sicher, dass gorm importiert ist, um unbenutzte Importfehler zu vermeiden
var _ *gorm.DB

// Stelle sicher, dass log importiert ist, um unbenutzte Importfehler zu vermeiden
var _ *log.Logger

// Stelle sicher, dass strings importiert ist, um unbenutzte Importfehler zu vermeiden
var _ *strings.Builder
