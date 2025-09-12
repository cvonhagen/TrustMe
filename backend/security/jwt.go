// JWT (JSON Web Token) Sicherheitsmodul für TrustMe
// Verwaltet sichere Token-Generierung und -Validierung für Benutzer-Authentifizierung
// Verwendet HMAC-SHA256 für Token-Signierung mit konfigurierbarem Secret
package security

import (
	"fmt"
	"log"
	"os"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

// GetJWTSecret holt sicherheitskritischen JWT-Schlüssel aus Umgebung
// Fail-Fast-Pattern: Anwendung startet nicht ohne gültigen Secret
// Schlüssel sollte mindestens 256-bit (32 Zeichen) für HS256 haben
func GetJWTSecret() string {
	key := os.Getenv("JWT_SECRET_KEY")
	if key == "" {
		log.Fatal("Umgebungsvariable JWT_SECRET_KEY ist nicht gesetzt")
	}
	return key
}

// Claims definiert JWT-Payload-Struktur mit benutzerdefinierten und Standard-Claims
// UserID: Eindeutige Benutzer-Identifikation für Autorisierung
// RegisteredClaims: Standard-JWT-Felder (exp, iat, iss, sub)
type Claims struct {
	UserID               uint `json:"user_id"` // Benutzer-ID für nachgelagerte Autorisierung
	jwt.RegisteredClaims      // Standard-JWT-Claims (Expiry, Issuer, etc.)
}

// GenerateJWTToken erstellt signierten JWT-Token für authentifizierten Benutzer
// 24-Stunden Gültigkeit balanciert Sicherheit und Benutzerfreundlichkeit
// HMAC-SHA256 Signierung bietet optimales Sicherheit/Performance-Verhältnis
func GenerateJWTToken(userID uint) (string, error) {
	jwtSecret := GetJWTSecret()
	claims := &Claims{
		UserID: userID,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(time.Hour * 24)), // 24h Sitzungsdauer
			IssuedAt:  jwt.NewNumericDate(time.Now()),                     // Ausstellungszeit für Audit
			Issuer:    "trustme-password-manager",                         // Service-Identifikation
			Subject:   fmt.Sprintf("%d", userID),                          // Benutzer-ID als Token-Subject
		},
	}

	// JWT-Token mit HMAC-SHA256 erstellen (beste Balance Security/Performance)
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)

	// Token mit Secret signieren - verhindert Manipulation
	tokenString, err := token.SignedString([]byte(jwtSecret))
	if err != nil {
		return "", fmt.Errorf("Fehler beim Signieren des Tokens: %w", err)
	}

	return tokenString, nil
}

// ValidateJWTToken prüft Token-Gültigkeit und extrahiert Benutzer-ID
// Umfassende Validierung: Signatur, Expiry, Claims-Struktur
// Rückgabe der UserID ermöglicht nachgelagerte Autorisierungsprüfungen
func ValidateJWTToken(tokenString string) (uint, error) {
	jwtSecret := GetJWTSecret()

	log.Printf("Validating token: %s", tokenString) // Debug: Token-Validierung verfolgen

	// JWT parsen und Claims extrahieren mit Signatur-Verifikation
	token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
		// Signaturmethode verifizieren - nur HMAC-SHA256 akzeptieren
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("Unerwartete Signaturmethode: %v", token.Header["alg"])
		}
		return []byte(jwtSecret), nil // Secret für Signatur-Verifikation
	})

	if err != nil {
		log.Printf("Token parsing/validation error: %v", err) // Debug: Parsing-Fehler tracken
		return 0, fmt.Errorf("failed to parse or validate token: %w", err)
	}

	// Claims-Typsicherheit und Token-Gültigkeit prüfen
	claims, ok := token.Claims.(*Claims)
	if !ok || !token.Valid {
		return 0, fmt.Errorf("Ungültige Token-Claims oder Token ist nicht gültig")
	}

	return claims.UserID, nil // Extrahierte UserID für Autorisierung zurückgeben
}
