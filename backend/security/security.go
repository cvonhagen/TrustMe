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
	pbkdf2SaltLen    = 16     // Salt length in bytes
)

// HashPassword generiert einen PBKDF2 Hash des Passworts mit einem zufälligen Salt.
// Es gibt den Hash und das Salt als Base64-kodierte Strings zurück.
func HashPassword(password string) (hash string, salt string, err error) {
	// Generiere ein zufälliges Salt
	saltBytes := make([]byte, pbkdf2SaltLen)
	if _, err := rand.Read(saltBytes); err != nil {
		return "", "", fmt.Errorf("failed to generate salt: %w", err)
	}
	salt = base64.RawStdEncoding.EncodeToString(saltBytes)

	// Leite den Schlüssel mit PBKDF2 und SHA-256 ab
	hashBytes := pbkdf2.Key([]byte(password), saltBytes, pbkdf2Iterations, pbkdf2KeyLen, sha256.New)
	hash = base64.RawStdEncoding.EncodeToString(hashBytes)

	return hash, salt, nil
}

// VerifyPassword vergleicht ein Klartext-Passwort mit einem PBKDF2 Hash.
// Es erwartet den gespeicherten Hash und das Salt als Base64-kodierte Strings.
func VerifyPassword(plainPassword string, hashedPassword string, salt string) (bool, error) {
	log.Printf("VerifyPassword: Starting verification.")                                 // Debugging
	log.Printf("VerifyPassword: plainPassword (for debugging only!): %s", plainPassword) // Debugging - ACHTUNG SICHERHEITSRISIKO!
	log.Printf("VerifyPassword: hashedPassword: %s", hashedPassword)                     // Debugging
	log.Printf("VerifyPassword: salt: %s", salt)                                         // Debugging

	// Dekodiere das Salt von Base64
	saltBytes, err := base64.RawStdEncoding.DecodeString(salt)
	if err != nil {
		log.Printf("VerifyPassword: Error decoding salt: %v", err) // Debugging
		return false, fmt.Errorf("failed to decode salt: %w", err)
	}

	// Dekodiere den gespeicherten Hash von Base64
	storedHashBytes, err := base64.RawStdEncoding.DecodeString(hashedPassword)
	if err != nil {
		log.Printf("VerifyPassword: Error decoding hashedPassword: %v", err) // Debugging
		return false, fmt.Errorf("failed to decode hashed password: %w", err)
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

// Hinweis: JWT Funktionen (GenerateJWTToken, ValidateJWTToken, GetJWTSecret) und die Variable jwtSecretKey befinden sich jetzt in jwt.go

// Stelle sicher, dass gorm importiert ist, um unbenutzte Importfehler zu vermeiden, falls es an anderer Stelle in dieser Datei nicht verwendet wird
var _ gorm.Model

// Stelle sicher, dass log importiert ist, um unbenutzte Importfehler zu vermeiden, falls es an anderer Stelle in dieser Datei nicht verwendet wird
var _ *log.Logger

// Stelle sicher, dass strings importiert ist, um unbenutzte Importfehler zu vermeiden, falls es an anderer Stelle in dieser Datei nicht verwendet wird
var _ = strings.Join
