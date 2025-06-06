package security

import (
	"fmt"
	"log"
	"os"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

// GetJWTSecret retrieves the JWT secret key from environment variables.
func GetJWTSecret() string {
	key := os.Getenv("JWT_SECRET_KEY")
	if key == "" {
		log.Fatal("JWT_SECRET_KEY environment variable not set")
	}
	return key
}

// Claims represents the JWT claims structure
type Claims struct {
	UserID uint `json:"user_id"`
	jwt.RegisteredClaims
}

// GenerateJWTToken creates a new JWT token for the given user ID.
func GenerateJWTToken(userID uint) (string, error) {
	jwtSecret := GetJWTSecret()
	claims := &Claims{
		UserID: userID,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(time.Hour * 24)), // Token expires after 24 hours
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			Issuer:    "trustme-password-manager",
			Subject:   fmt.Sprintf("%d", userID), // Subject is the user ID
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)

	// Sign the token with the secret
	tokenString, err := token.SignedString([]byte(jwtSecret))
	if err != nil {
		return "", fmt.Errorf("failed to sign token: %w", err)
	}

	return tokenString, nil
}

// ValidateJWTToken validates the given JWT token and returns the user ID.
func ValidateJWTToken(tokenString string) (uint, error) {
	jwtSecret := GetJWTSecret()

	token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
		// Validate the signing method
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return []byte(jwtSecret), nil
	})

	if err != nil {
		return 0, fmt.Errorf("failed to parse or validate token: %w", err)
	}

	claims, ok := token.Claims.(*Claims)
	if !ok || !token.Valid {
		return 0, fmt.Errorf("invalid token claims or token is not valid")
	}

	return claims.UserID, nil
}
