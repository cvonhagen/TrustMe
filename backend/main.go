package main

import (
	"backend/handlers"
	"backend/models"
	"backend/security"
	"backend/services"
	"fmt"
	"log"
	"os"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/joho/godotenv"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var DB *gorm.DB

func initDB() {
	log.Println("Attempting to load .env file")
	err := godotenv.Load()
	if err != nil {
		log.Printf("Error loading .env file: %v", err)
	}

	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		log.Fatal("DATABASE_URL environment variable not set")
	}
	log.Printf("DATABASE_URL is set: %s", dsn)

	log.Println("Attempting to connect to database")
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	DB = db
	log.Println("Database connected successfully")

	log.Println("Running database auto migration")
	err = DB.AutoMigrate(&models.User{}, &models.Password{})
	if err != nil {
		log.Fatalf("Failed to auto migrate database: %v", err)
	}
	log.Println("Database migration complete")

	// Temporary: Verify users after migration
	var users []models.User
	if err := DB.Find(&users).Error; err != nil {
		log.Printf("Error fetching users after migration: %v", err)
	} else {
		log.Println("Users found in DB after migration:")
		for _, user := range users {
			log.Printf("- %s (ID: %d)", user.Username, user.ID)
		}
	}
}

// AuthRequired middleware to protect routes
func AuthRequired() func(*fiber.Ctx) error {
	return func(c *fiber.Ctx) error {
		authHeader := c.Get("Authorization")
		if authHeader == "" {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Authorization header missing"})
		}

		// Expecting "Bearer TOKEN"
		tokenString := ""
		_, err := fmt.Sscanf(authHeader, "Bearer %s", &tokenString)
		if err != nil || tokenString == "" {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Invalid Authorization header format"})
		}

		userID, err := security.ValidateJWTToken(tokenString)
		if err != nil {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Invalid or expired token"})
		}

		// Store user ID in context locals
		c.Locals("userID", userID)

		return c.Next() // Continue to the next handler
	}
}

func main() {
	initDB()

	// Initialize services
	userService := services.NewUserService(DB)
	authService := services.NewAuthService(DB, userService)
	passwordService := services.NewPasswordService(DB)
	twoFAService := services.NewTwoFAService(DB, userService)

	// Initialize handlers
	authHandler := handlers.NewAuthHandler(authService)
	passwordHandler := handlers.NewPasswordHandler(passwordService, userService)
	twoFAHandler := handlers.NewTwoFAHandler(twoFAService, userService)

	app := fiber.New()

	// Add CORS middleware
	app.Use(cors.New(cors.Config{
		AllowOrigins:     "http://localhost:5173",
		AllowHeaders:     "Origin, Content-Type, Accept, Authorization, X-Requested-With, X-CSRF-Token, X-Auth-Token, X-Requested-With, X-XSRF-Token, XMLHttpRequest",
		AllowMethods:     "GET,POST,PUT,DELETE,OPTIONS",
		AllowCredentials: true,
	}))

	// Setup routes
	api := app.Group("/api/v1")

	// Auth routes (no authentication required)
	auth := api.Group("/auth")
	auth.Post("/register", authHandler.Register)
	auth.Post("/login", authHandler.Login)

	// Password routes (authentication required)
	passwords := api.Group("/passwords", AuthRequired()) // Apply AuthRequired middleware
	passwords.Post("/", passwordHandler.CreatePassword)
	passwords.Get("/", passwordHandler.GetPasswords)
	passwords.Get("/:id", passwordHandler.GetPassword)
	passwords.Put("/:id", passwordHandler.UpdatePassword)
	passwords.Delete("/:id", passwordHandler.DeletePassword)

	// 2FA routes
	twofa := api.Group("/two-factor")

	// 2FA setup routes (authentication required)
	twofa.Post("/setup", AuthRequired(), twoFAHandler.InitiateSetup)
	twofa.Post("/setup/verify", AuthRequired(), twoFAHandler.VerifySetupCode)

	// 2FA verification route (no authentication required, used during login flow)
	twofa.Post("/verify", twoFAHandler.VerifyLoginCode)

	log.Println("Fiber server starting on port 3030")
	log.Fatal(app.Listen(":3030"))
}
