package main

import (
	"backend/handlers"
	"backend/models"
	"backend/security"
	"backend/services"
	"fmt"
	"log"
	"os"
	"os/signal"
	"strings"
	"syscall"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/helmet"
	"github.com/gofiber/fiber/v2/middleware/limiter"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/fiber/v2/middleware/recover"
	"github.com/joho/godotenv"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var DB *gorm.DB

// initDB initializes the database connection and runs migrations
func initDB() error {
	log.Println("Loading environment configuration...")
	if err := godotenv.Load(); err != nil {
		log.Printf("Warning: .env file not found or couldn't be loaded: %v", err)
		// Don't fatal here - environment variables might be set externally
	}

	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		return fmt.Errorf("DATABASE_URL environment variable is required")
	}

	log.Println("Connecting to database...")
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{
		// Add some performance optimizations
		PrepareStmt: true,
		// Disable foreign key constraint when migrating
		DisableForeignKeyConstraintWhenMigrating: true,
	})
	if err != nil {
		return fmt.Errorf("failed to connect to database: %w", err)
	}

	// Configure connection pool
	sqlDB, err := db.DB()
	if err != nil {
		return fmt.Errorf("failed to get underlying sql.DB: %w", err)
	}

	// Connection pool settings
	sqlDB.SetMaxIdleConns(10)
	sqlDB.SetMaxOpenConns(100)
	sqlDB.SetConnMaxLifetime(time.Hour)

	DB = db
	log.Println("Database connected successfully")

	// Run migrations
	log.Println("Running database migrations...")
	if err := DB.AutoMigrate(&models.User{}, &models.Password{}); err != nil {
		return fmt.Errorf("failed to run database migrations: %w", err)
	}
	log.Println("Database migrations completed successfully")

	return nil
}

// AuthRequired middleware for protecting routes
func AuthRequired() fiber.Handler {
	return func(c *fiber.Ctx) error {
		authHeader := c.Get("Authorization")
		if authHeader == "" {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "Authorization header is required",
			})
		}

		// Extract Bearer token
		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) != 2 || strings.ToLower(parts[0]) != "bearer" {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "Invalid Authorization header format. Expected: Bearer <token>",
			})
		}

		tokenString := parts[1]
		if tokenString == "" {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "Token cannot be empty",
			})
		}

		userID, err := security.ValidateJWTToken(tokenString)
		if err != nil {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "Invalid or expired token",
			})
		}

		// Store user ID in context
		c.Locals("userID", userID)
		return c.Next()
	}
}

// setupMiddleware configures all middleware for the application
func setupMiddleware(app *fiber.App) {
	// Security middleware
	app.Use(helmet.New(helmet.Config{
		XSSProtection:             "1; mode=block",
		ContentTypeNosniff:        "nosniff",
		XFrameOptions:             "DENY",
		ReferrerPolicy:            "no-referrer",
		CrossOriginEmbedderPolicy: "require-corp",
	}))

	// Recovery middleware to handle panics
	app.Use(recover.New())

	// Request logging
	app.Use(logger.New(logger.Config{
		Format: "[${time}] ${status} - ${method} ${path} - ${latency}\n",
	}))

	// Rate limiting
	app.Use(limiter.New(limiter.Config{
		Max:        100,
		Expiration: time.Minute,
		KeyGenerator: func(c *fiber.Ctx) string {
			return c.Get("x-forwarded-for", c.IP())
		},
		LimitReached: func(c *fiber.Ctx) error {
			return c.Status(fiber.StatusTooManyRequests).JSON(fiber.Map{
				"error": "Too many requests. Please try again later.",
			})
		},
	}))

	// CORS configuration
	app.Use(cors.New(cors.Config{
		AllowOrigins:     getEnv("ALLOWED_ORIGINS", "http://localhost:5173"),
		AllowHeaders:     "Origin, Content-Type, Accept, Authorization, X-Requested-With",
		AllowMethods:     "GET,POST,PUT,DELETE,OPTIONS",
		AllowCredentials: true,
		MaxAge:           86400, // 24 hours
	}))
}

// setupRoutes configures all application routes
func setupRoutes(app *fiber.App, handlers *Handlers) {
	// Health check endpoint
	app.Get("/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"status":    "healthy",
			"timestamp": time.Now().UTC(),
		})
	})

	api := app.Group("/api/v1")

	// Authentication routes (public)
	auth := api.Group("/auth")
	auth.Post("/register", handlers.Auth.Register)
	auth.Post("/login", handlers.Auth.Login)
	auth.Post("/logout", AuthRequired(), handlers.Auth.Logout) // Add logout endpoint

	// Password management routes (protected)
	passwords := api.Group("/passwords", AuthRequired())
	passwords.Post("/", handlers.Password.CreatePassword)
	passwords.Get("/", handlers.Password.GetPasswords)
	passwords.Get("/:id", handlers.Password.GetPassword)
	passwords.Put("/:id", handlers.Password.UpdatePassword)
	passwords.Delete("/:id", handlers.Password.DeletePassword)

	// Two-Factor Authentication routes
	twofa := api.Group("/two-factor")

	// 2FA setup (protected)
	twofa.Post("/setup", AuthRequired(), handlers.TwoFA.InitiateSetup)
	twofa.Post("/setup/verify", AuthRequired(), handlers.TwoFA.VerifySetupCode)
	twofa.Delete("/disable", AuthRequired(), handlers.TwoFA.DisableTwoFA) // Add disable 2FA

	// 2FA verification (public - used during login)
	twofa.Post("/verify", handlers.TwoFA.VerifyLoginCode)

	// User management routes (protected)
	users := api.Group("/users", AuthRequired())
	users.Get("/profile", handlers.User.GetProfile)
	users.Put("/profile", handlers.User.UpdateProfile)
	users.Delete("/account", handlers.User.DeleteAccount)
}

// Handlers struct to group all handlers
type Handlers struct {
	Auth     *handlers.AuthHandler
	Password *handlers.PasswordHandler
	TwoFA    *handlers.TwoFAHandler
	User     *handlers.UserHandler // Add user handler
}

// initServices initializes all application services
func initServices() *Handlers {
	userService := services.NewUserService(DB)
	authService := services.NewAuthService(DB, userService)
	passwordService := services.NewPasswordService(DB)
	twoFAService := services.NewTwoFAService(DB, userService)

	return &Handlers{
		Auth:     handlers.NewAuthHandler(authService),
		Password: handlers.NewPasswordHandler(passwordService, userService),
		TwoFA:    handlers.NewTwoFAHandler(twoFAService, userService),
		User:     handlers.NewUserHandler(userService), // Initialize user handler
	}
}

// getEnv gets environment variable with fallback
func getEnv(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}

// gracefulShutdown handles graceful server shutdown
func gracefulShutdown(app *fiber.App) {
	c := make(chan os.Signal, 1)
	signal.Notify(c, os.Interrupt, syscall.SIGTERM)

	go func() {
		<-c
		log.Println("Gracefully shutting down...")

		// Close database connection
		if DB != nil {
			sqlDB, err := DB.DB()
			if err == nil {
				sqlDB.Close()
			}
		}

		// Shutdown server
		if err := app.ShutdownWithTimeout(30 * time.Second); err != nil {
			log.Printf("Server shutdown error: %v", err)
		}

		log.Println("Server shutdown complete")
	}()
}

func main() {
	log.Println("Starting Password Manager Backend...")

	// Initialize database
	if err := initDB(); err != nil {
		log.Fatalf("Database initialization failed: %v", err)
	}

	// Initialize services and handlers
	handlers := initServices()

	// Create Fiber app with custom config
	app := fiber.New(fiber.Config{
		ErrorHandler: func(c *fiber.Ctx, err error) error {
			code := fiber.StatusInternalServerError
			message := "Internal Server Error"

			if e, ok := err.(*fiber.Error); ok {
				code = e.Code
				message = e.Message
			}

			log.Printf("Error: %v", err)

			return c.Status(code).JSON(fiber.Map{
				"error": message,
			})
		},
		ReadTimeout:  time.Second * 30,
		WriteTimeout: time.Second * 30,
		IdleTimeout:  time.Second * 120,
	})

	// Setup middleware and routes
	setupMiddleware(app)
	setupRoutes(app, handlers)

	// Setup graceful shutdown
	gracefulShutdown(app)

	// Start server
	port := getEnv("PORT", "3030")
	log.Printf("Server starting on port %s", port)
	log.Printf("Environment: %s", getEnv("ENV", "development"))

	if err := app.Listen(":" + port); err != nil {
		log.Fatalf("Server failed to start: %v", err)
	}
}
