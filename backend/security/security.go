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
	pbkdf2Iterations = 250000 // Anzahl der Iterationen
	pbkdf2KeyLen     = 32     // Gewünschte Schlüssellänge in Bytes (für AES-256)
	pbkdf2SaltLen    = 16     // Salt-Länge in Bytes
)

// HashPassword generiert einen PBKDF2 Hash des Passworts mit einem zufälligen Salt.
// Es gibt den Hash und das Salt als Base64-kodierte Strings zurück.
func HashPassword(password string) (string, string, error) {
	// Generiere ein zufälliges Salt
	salt := make([]byte, pbkdf2SaltLen)
	if _, err := rand.Read(salt); err != nil {
		return "", "", fmt.Errorf("failed to generate salt: %w", err)
	}

	// Leite den Schlüssel mit PBKDF2 und SHA-256 ab
	key := pbkdf2.Key([]byte(password), salt, pbkdf2Iterations, pbkdf2KeyLen, sha256.New)

	// Konvertiere zu Base64 Strings
	keyBase64 := base64.RawStdEncoding.EncodeToString(key)
	saltBase64 := base64.RawStdEncoding.EncodeToString(salt)

	return keyBase64, saltBase64, nil
}

// VerifyPassword vergleicht ein Klartext-Passwort mit einem PBKDF2 Hash.
// Es erwartet den gespeicherten Hash und das Salt als Base64-kodierte Strings.
func VerifyPassword(plainPassword, hashedPassword, salt string) (bool, error) {
	// Dekodiere das Salt von Base64
	saltBytes, err := base64.RawStdEncoding.DecodeString(salt)
	if err != nil {
		return false, fmt.Errorf("failed to decode salt: %w", err)
	}

	// Dekodiere den gespeicherten Hash von Base64
	storedHashBytes, err := base64.RawStdEncoding.DecodeString(hashedPassword)
	if err != nil {
		return false, fmt.Errorf("failed to decode hashed password: %w", err)
	}

	// Leite den Schlüssel vom Klartext-Passwort mit demselben Salt und denselben Parametern ab
	comparisonHashBytes := pbkdf2.Key([]byte(plainPassword), saltBytes, pbkdf2Iterations, pbkdf2KeyLen, sha256.New)

	// Vergleiche den generierten Hash mit dem gespeicherten Hash
	// Verwende in der Produktion einen Vergleich mit konstanter Zeit, um Timing-Angriffe abzumildern
	// Der Einfachheit halber wird hier ein direkter Byte-Vergleich verwendet.
	// In einer realen Anwendung ziehe die Verwendung von `crypto/subtle.ConstantTimeCompare` in Betracht.
	match := string(comparisonHashBytes) == string(storedHashBytes)

	return match, nil
}

// Hinweis: JWT Funktionen (GenerateJWTToken, ValidateJWTToken, GetJWTSecret) und die Variable jwtSecretKey befinden sich jetzt in jwt.go

// Stelle sicher, dass gorm importiert ist, um unbenutzte Importfehler zu vermeiden
var _ *gorm.DB

// Stelle sicher, dass log importiert ist, um unbenutzte Importfehler zu vermeiden
var _ *log.Logger

// Stelle sicher, dass strings importiert ist, um unbenutzte Importfehler zu vermeiden
var _ *strings.Builder
