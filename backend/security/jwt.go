package security

import (
	"fmt"
	"log"
	"os"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

// GetJWTSecret ruft den JWT Secret Key aus den Umgebungsvariablen ab.
// Wenn der Schlüssel nicht gesetzt ist, wird ein fataler Fehler ausgelöst.
func GetJWTSecret() string {
	key := os.Getenv("JWT_SECRET_KEY")
	if key == "" {
		log.Fatal("Umgebungsvariable JWT_SECRET_KEY ist nicht gesetzt")
	}
	return key
}

// Claims repräsentiert die JWT-Claims-Struktur, die benutzerdefinierte Felder (UserID) und registrierte Claims enthält.
type Claims struct {
	UserID uint `json:"user_id"` // Benutzer-ID, die im Token gespeichert wird
	jwt.RegisteredClaims
}

// GenerateJWTToken generiert einen neuen JWT-Token für die gegebene Benutzer-ID.
// Der Token ist 24 Stunden gültig.
func GenerateJWTToken(userID uint) (string, error) {
	jwtSecret := GetJWTSecret()
	claims := &Claims{
		UserID: userID,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(time.Hour * 24)), // Token läuft nach 24 Stunden ab
			IssuedAt:  jwt.NewNumericDate(time.Now()),                     // Zeitpunkt der Token-Ausstellung
			Issuer:    "trustme-password-manager",                         // Aussteller des Tokens
			Subject:   fmt.Sprintf("%d", userID),                          // Betreff des Tokens (Benutzer-ID als String)
		},
	}

	// Erstelle einen neuen Token mit HS256 Signaturmethode und den definierten Claims
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)

	// Unterschreibe den Token mit dem Secret Key
	tokenString, err := token.SignedString([]byte(jwtSecret))
	if err != nil {
		return "", fmt.Errorf("Fehler beim Signieren des Tokens: %w", err)
	}

	return tokenString, nil
}

// ValidateJWTToken validiert den gegebenen JWT-Token und gibt die Benutzer-ID zurück.
// Bei einem ungültigen oder abgelaufenen Token wird ein Fehler zurückgegeben.
func ValidateJWTToken(tokenString string) (uint, error) {
	jwtSecret := GetJWTSecret()

	// Parsen und Validieren des Tokens mit den definierten Claims und der Secret-Funktion
	token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
		// Überprüfe die Signaturmethode
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("Unerwartete Signaturmethode: %v", token.Header["alg"])
		}
		return []byte(jwtSecret), nil // Gebe den Secret Key zur Verifizierung zurück
	})

	if err != nil {
		return 0, fmt.Errorf("Fehler beim Parsen oder Validieren des Tokens: %w", err)
	}

	// Prüfe, ob die Claims gültig sind und der Token selbst gültig ist
	claims, ok := token.Claims.(*Claims)
	if !ok || !token.Valid {
		return 0, fmt.Errorf("Ungültige Token-Claims oder Token ist nicht gültig")
	}

	return claims.UserID, nil // Gebe die extrahierte Benutzer-ID zurück
}
