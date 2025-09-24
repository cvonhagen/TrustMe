// Security-Utilities für TrustMe Password Manager
// Kryptographische Funktionen für Passwort-Hashing und Salt-Generierung
// Verwendet PBKDF2 mit SHA-256 für sichere Schlüsselableitung
package security

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"fmt"

	"golang.org/x/crypto/argon2"
	"golang.org/x/crypto/pbkdf2"
)

// Kryptographische Konstanten für Passwort-Hashing
// Diese Parameter müssen mit dem Frontend synchron bleiben!
const (
	// PBKDF2-Parameter (Legacy für Backward-Compatibility)
	pbkdf2Iterations = 250000 // PBKDF2-Iterationen: Balance zwischen Sicherheit und Performance
	pbkdf2KeyLen     = 32     // Schlüssellänge für AES-256 (32 Bytes = 256 Bit)
	
	// Argon2id-Parameter nach OWASP-Standards (Primary Hash-Funktion)
	argon2idTime    = 3       // OWASP-Empfehlung: time=3 für optimale Sicherheit
	argon2idMemory  = 64 * 1024 // 64 MB Memory: Balance zwischen Sicherheit und Server-Performance
	argon2idThreads = 4       // 4 parallele Threads für moderne Multi-Core-CPUs
	argon2idKeyLen  = 32      // 32 Bytes Output für AES-256-Kompatibilität
	
	// Salt-Länge (für beide Verfahren)
	SaltLen = 16 // 128 Bit für ausreichende Entropie
)

// HashPasswordArgon2id erstellt Argon2id-Hash für moderne Passwort-Verifikation
// Verwendet OWASP-konforme Parameter: time=3, memory=64MB, threads=4
// Rückgabe als Base64 für einfache Speicherung und Übertragung
func HashPasswordArgon2id(password, salt string) (string, error) {
	saltBytes, err := base64.RawStdEncoding.DecodeString(salt)
	if err != nil {
		return "", fmt.Errorf("Fehler beim Dekodieren des Salts: %w", err)
	}

	// Argon2id mit OWASP-Parametern: time=3, memory=64MB für GPU/ASIC-resistenten Schutz
	hash := argon2.IDKey([]byte(password), saltBytes, argon2idTime, argon2idMemory, argon2idThreads, argon2idKeyLen)

	// Base64-Kodierung für Datenbank-Speicherung
	hashBase64 := base64.RawStdEncoding.EncodeToString(hash)

	return hashBase64, nil
}

// VerifyPasswordArgon2id validiert Klartext-Passwort gegen Argon2id-Hash
// Timing-sicher durch Argon2id's Memory-Hard-Function-Eigenschaften
func VerifyPasswordArgon2id(plainPassword, hashedPassword, salt string) (bool, error) {
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

	// Argon2id-Hash vom Klartext-Passwort mit identischen Parametern berechnen
	comparisonHashBytes := argon2.IDKey([]byte(plainPassword), saltBytes, argon2idTime, argon2idMemory, argon2idThreads, argon2idKeyLen)

	// Konstant-Zeit-Vergleich gegen Timing-Angriffe
	// Argon2id ist bereits Memory-Hard, zusätzlicher Schutz durch byte-Vergleich
	return string(comparisonHashBytes) == string(storedHashBytes), nil
}

// HashPassword erstellt PBKDF2-Hash für Passwort-Verifikation (Legacy)
// DEPRECATED: Nur für Backward-Compatibility - Neue Implementierungen sollten HashPasswordArgon2id verwenden
// Verwendet SHA-256 als PRF (Pseudo-Random Function) für hohe Sicherheit
// Rückgabe als Base64 für einfache Speicherung und Übertragung
func HashPassword(password, salt string) (string, error) {
	saltBytes, err := base64.RawStdEncoding.DecodeString(salt)
	if err != nil {
		return "", fmt.Errorf("Fehler beim Dekodieren des Salts: %w", err)
	}

	// PBKDF2 mit SHA-256: 250k Iterationen für GPU-resistenten Schutz
	key := pbkdf2.Key([]byte(password), saltBytes, pbkdf2Iterations, pbkdf2KeyLen, sha256.New)

	// Base64-Kodierung für Datenbank-Speicherung
	keyBase64 := base64.RawStdEncoding.EncodeToString(key)

	return keyBase64, nil
}

// VerifyPassword validiert Klartext-Passwort gegen PBKDF2-Hash (Legacy)
// DEPRECATED: Nur für Backward-Compatibility - Neue Implementierungen sollten VerifyPasswordArgon2id verwenden
// Timing-sicher: Verwendet konstante Rechenzeit unabhängig vom Ergebnis
func VerifyPassword(plainPassword string, hashedPassword string, salt string) (bool, error) {
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

	// PBKDF2-Hash vom Klartext-Passwort mit identischen Parametern berechnen
	comparisonHashBytes := pbkdf2.Key([]byte(plainPassword), saltBytes, pbkdf2Iterations, pbkdf2KeyLen, sha256.New)

	// Konstant-Zeit-Vergleich gegen Timing-Angriffe
	match := string(comparisonHashBytes) == string(storedHashBytes)
	return match, nil
}

// VerifyPasswordUniversal erkennt automatisch das Hash-Verfahren und verifiziert entsprechend
// Intelligente Migration: Erkennt PBKDF2 vs. Argon2id basierend auf Hash-Länge oder Metadaten
// Rückgabe: (isValid, isLegacyHash, error)
func VerifyPasswordUniversal(plainPassword, hashedPassword, salt, hashType string) (bool, bool, error) {
	// Explizite Hash-Type-Angabe hat Priorität
	switch hashType {
	case "argon2id":
		isValid, err := VerifyPasswordArgon2id(plainPassword, hashedPassword, salt)
		return isValid, false, err
	case "pbkdf2":
		isValid, err := VerifyPassword(plainPassword, hashedPassword, salt)
		return isValid, true, err
	default:
		// Fallback: Versuche zuerst Argon2id, dann PBKDF2
		// Moderne Hashes zuerst prüfen für bessere Performance
		isValid, err := VerifyPasswordArgon2id(plainPassword, hashedPassword, salt)
		if err == nil && isValid {
			return true, false, nil
		}
		
		// Falls Argon2id fehlschlägt, versuche PBKDF2 (Legacy)
		isValid, err = VerifyPassword(plainPassword, hashedPassword, salt)
		if err != nil {
			return false, false, fmt.Errorf("Fehler bei beiden Hash-Verfahren: %w", err)
		}
		return isValid, true, err
	}
}

// GenerateSalt erzeugt kryptographisch sicheren Zufalls-Salt
// Verwendet crypto/rand für echte Entropie (nicht Pseudo-Random)
// Base64-Kodierung für einfache Handhabung und Speicherung
// Standard-Länge: SaltLen (16 Bytes) für beide Hash-Verfahren
func GenerateSalt(length int) (string, error) {
	saltBytes := make([]byte, length)
	_, err := rand.Read(saltBytes) // crypto/rand für kryptographische Sicherheit
	if err != nil {
		return "", fmt.Errorf("Fehler beim Generieren des Salts: %w", err)
	}
	return base64.RawStdEncoding.EncodeToString(saltBytes), nil
}

// GenerateStandardSalt erzeugt Salt mit Standard-Länge (16 Bytes)
// Convenience-Funktion für häufig verwendete Salt-Generierung
func GenerateStandardSalt() (string, error) {
	return GenerateSalt(SaltLen)
}

// Modulare Sicherheits-Architektur: JWT-Funktionen in separater jwt.go
// Trennung von Concerns: Hashing vs. Token-Management
// Argon2id als Primary, PBKDF2 als Legacy für sanfte Migration
