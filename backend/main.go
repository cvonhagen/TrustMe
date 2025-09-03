// TrustMe Password Manager Backend
// Sichere REST API mit JWT-Authentifizierung und client-seitiger Verschlüsselung
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

var DB *gorm.DB // Globale Datenbankverbindung

// Datenbank-Initialisierung mit PostgreSQL und GORM
func initDB() error {
	// .env-Datei laden (optional)
	if err := godotenv.Load(); err != nil {
		log.Printf("Warnung: .env-Datei nicht gefunden: %v", err)
	}

	// PostgreSQL-Verbindungsstring aus Umgebungsvariable
	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		return fmt.Errorf("DATABASE_URL umgebungsvariable erforderlich")
	}

	// GORM-Datenbankverbindung mit Performance-Optimierungen
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{
		PrepareStmt:                              true, // Prepared Statements für bessere Performance
		DisableForeignKeyConstraintWhenMigrating: true,
	})
	if err != nil {
		return fmt.Errorf("verbindung zur Datenbank fehlgeschlagen: %w", err)
	}

	// Verbindungspool konfigurieren
	sqlDB, err := db.DB()
	if err != nil {
		return fmt.Errorf("zugrunde liegendes sql.DB konnte nicht abgerufen werden: %w", err)
	}

	// Verbindungspool-Einstellungen
	sqlDB.SetMaxIdleConns(10)           // Maximale Anzahl der inaktiven Verbindungen im Pool
	sqlDB.SetMaxOpenConns(100)          // Maximale Anzahl der offenen Verbindungen zum Pool
	sqlDB.SetConnMaxLifetime(time.Hour) // Maximale Lebensdauer einer Verbindung

	DB = db

	// Tabellen löschen und neu erstellen
	DB.Migrator().DropTable(&models.Password{})
	DB.Migrator().DropTable(&models.User{})

	// Automatische Tabellen-Migration (User & Password Models)
	if err := DB.AutoMigrate(&models.User{}, &models.Password{}); err != nil {
		return fmt.Errorf("datenbankmigrationen fehlgeschlagen: %w", err)
	}

	return nil
}

// JWT-Authentifizierungs-Middleware für geschützte Routen
func AuthRequired() fiber.Handler {
	return func(c *fiber.Ctx) error {
		// Authorization-Header prüfen
		authHeader := c.Get("Authorization")
		if authHeader == "" {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "authorization-Header ist erforderlich",
			})
		}

		// Bearer-Token extrahieren
		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) != 2 || strings.ToLower(parts[0]) != "bearer" {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "ungültiges Format des Authorization-Headers. Erwartet: Bearer <token>",
			})
		}

		tokenString := parts[1]
		if tokenString == "" {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "token darf nicht leer sein",
			})
		}

		// JWT-Token validieren und User-ID extrahieren
		userID, err := security.ValidateJWTToken(tokenString)
		if err != nil {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "ungültiger oder abgelaufener Token",
			})
		}

		// User-ID für nachfolgende Handler verfügbar machen
		c.Locals("userID", userID)
		return c.Next()
	}
}

// setupMiddleware konfiguriert alle Middleware für die Anwendung.
func setupMiddleware(app *fiber.App) {
	// Sicherheits-Middleware (Helmet) für verschiedene HTTP-Header zum Schutz der Anwendung
	app.Use(helmet.New(helmet.Config{
		XSSProtection:             "1; mode=block", // Aktiviert XSS-Filterung
		ContentTypeNosniff:        "nosniff",       // Verhindert MIME-Typ-Sniffing
		XFrameOptions:             "DENY",          // Verhindert Clickjacking durch Iframes
		ReferrerPolicy:            "no-referrer",   // Steuert die Referrer-Informationen
		CrossOriginEmbedderPolicy: "require-corp",  // Steuert Cross-Origin-Embedding
	}))

	// Recovery-Middleware zur Behandlung von Panics und zur Vermeidung von Serverabstürzen
	app.Use(recover.New())

	// Request-Logging-Middleware zur Protokollierung von HTTP-Anfragen
	app.Use(logger.New(logger.Config{
		Format: "[${time}] ${status} - ${method} ${path} - ${latency}\n", // Log-Format definieren
	}))

	// Rate-Limiting-Middleware zur Begrenzung der Anfragen pro Minute von einer IP-Adresse
	app.Use(limiter.New(limiter.Config{
		Max:        1000000,     // Maximal 1.000.000 Anfragen pro Minute (stark erhöht für umfangreiche Datengenerierung)
		Expiration: time.Minute, // Limit-Fenster: 1 Minute
		KeyGenerator: func(c *fiber.Ctx) string {
			return c.Get("x-forwarded-for", c.IP()) // Rate-Limiting basierend auf IP-Adresse
		},
		LimitReached: func(c *fiber.Ctx) error {
			return c.Status(fiber.StatusTooManyRequests).JSON(fiber.Map{
				"error": "zu viele Anfragen. Bitte versuchen Sie es später erneut.",
			})
		},
	}))

	// CORS-Konfiguration (Cross-Origin Resource Sharing)
	app.Use(cors.New(cors.Config{
		AllowOrigins:     getEnv("ALLOWED_ORIGINS", "http://localhost:5173"),              // Erlaubte Ursprünge
		AllowHeaders:     "Origin, Content-Type, Accept, Authorization, X-Requested-With", // Erlaubte Header
		AllowMethods:     "GET,POST,PUT,DELETE,OPTIONS",                                   // Erlaubte HTTP-Methoden
		AllowCredentials: true,                                                            // Cookies und HTTP-Authentifizierungs-Header zulassen
		MaxAge:           86400,                                                           // 24 Stunden Cache für Preflight-Anfragen
	}))
}

// setupRoutes konfiguriert alle Anwendungsrouten.
func setupRoutes(app *fiber.App, handlers *Handlers) {
	// Health-Check-Endpunkt
	app.Get("/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"status":    "healthy",        // Status der Anwendung
			"timestamp": time.Now().UTC(), // Aktueller Zeitstempel in UTC
		})
	})

	// API-Gruppen für die Versionskontrolle
	api := app.Group("/api/v1")

	// Authentifizierungsrouten (öffentlich zugänglich)
	auth := api.Group("/auth")
	auth.Post("/register", handlers.Auth.Register)                       // Benutzerregistrierung
	auth.Post("/login", handlers.Auth.Login)                             // Benutzeranmeldung
	auth.Get("/validate", AuthRequired(), handlers.Auth.ValidateToken)   // Token validieren (geschützt)
	auth.Post("/logout", AuthRequired(), handlers.Auth.Logout)           // Benutzerabmeldung (geschützt)
	auth.Delete("/account", AuthRequired(), handlers.Auth.DeleteAccount) // Account löschen (geschützt)

	// Passwortverwaltungsrouten (geschützt, erfordert Authentifizierung)
	passwords := api.Group("/passwords", AuthRequired())
	passwords.Post("/", handlers.Password.CreatePassword)            // Passwort erstellen
	passwords.Post("/batch", handlers.Password.BatchCreatePasswords) // Batch-Passwörter erstellen
	passwords.Get("/", handlers.Password.GetPasswords)               // Alle Passwörter abrufen
	passwords.Get("/:id", handlers.Password.GetPassword)             // Einzelnes Passwort nach ID abrufen
	passwords.Put("/:id", handlers.Password.UpdatePassword)          // Passwort aktualisieren
	passwords.Delete("/:id", handlers.Password.DeletePassword)       // Passwort löschen

	// Zwei-Faktor-Authentifizierungsrouten (2FA)
	twofa := api.Group("/two-factor")

	// 2FA-Einrichtung (geschützt)
	twofa.Post("/setup", AuthRequired(), handlers.TwoFA.InitiateSetup)          // 2FA-Einrichtung initiieren
	twofa.Post("/setup/verify", AuthRequired(), handlers.TwoFA.VerifySetupCode) // 2FA-Einrichtungscode verifizieren
	twofa.Delete("/disable", AuthRequired(), handlers.TwoFA.DisableTwoFA)       // 2FA deaktivieren (geschützt)

	// 2FA-Verifizierung (öffentlich - während des Logins verwendet)
	twofa.Post("/verify", handlers.TwoFA.VerifyLoginCode) // 2FA-Login-Code verifizieren

	// Benutzerverwaltungsrouten (geschützt)
	users := api.Group("/users", AuthRequired())
	users.Get("/profile", handlers.User.GetProfile)       // Benutzerprofil abrufen
	users.Put("/profile", handlers.User.UpdateProfile)    // Benutzerprofil aktualisieren
	users.Delete("/account", handlers.User.DeleteAccount) // Benutzerkonto löschen
}

// Handlers-Struktur gruppiert alle Handler für die Anwendung.
type Handlers struct {
	Auth     *handlers.AuthHandler
	Password *handlers.PasswordHandler
	TwoFA    *handlers.TwoFAHandler
	User     *handlers.UserHandler
}

// initServices initialisiert alle Anwendungsdienste (Services).
func initServices() *Handlers {
	userService := services.NewUserService(DB)                // Benutzerdienst erstellen
	authService := services.NewAuthService(DB, userService)   // Authentifizierungsdienst erstellen
	passwordService := services.NewPasswordService(DB)        // Passwortdienst erstellen
	twoFAService := services.NewTwoFAService(DB, userService) // 2FA-Dienst erstellen

	// Handler mit den entsprechenden Diensten initialisieren und zurückgeben
	return &Handlers{
		Auth:     handlers.NewAuthHandler(authService),
		Password: handlers.NewPasswordHandler(passwordService, userService),
		TwoFA:    handlers.NewTwoFAHandler(twoFAService, userService),
		User:     handlers.NewUserHandler(userService),
	}
}

// getEnv ruft eine Umgebungsvariable ab und verwendet einen Fallback-Wert, falls nicht gesetzt.
func getEnv(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}

// gracefulShutdown behandelt das ordnungsgemäße Herunterfahren des Servers.
func gracefulShutdown(app *fiber.App) {
	// Kanal für Betriebssystemsignale erstellen
	c := make(chan os.Signal, 1)
	// SIGINT (Ctrl+C) und SIGTERM (kill-Befehl) abfangen
	signal.Notify(c, os.Interrupt, syscall.SIGTERM)

	go func() {
		<-c // Warten, bis ein Signal empfangen wird

		// Datenbankverbindung schließen
		if DB != nil {
			sqlDB, err := DB.DB()
			if err == nil {
				sqlDB.Close() // Datenbankverbindung schließen
			}
		}

		// Server mit Timeout herunterfahren
		if err := app.ShutdownWithTimeout(30 * time.Second); err != nil {
			log.Printf("Server-Shutdown-Fehler: %v", err)
		}
	}()
}

func main() {
	// Datenbank initialisieren
	if err := initDB(); err != nil {
		log.Fatalf("datenbankinitialisierung fehlgeschlagen: %v", err)
	}

	// Dienste und Handler initialisieren
	handlers := initServices()

	// Fiber-Anwendung mit benutzerdefinierter Konfiguration erstellen
	app := fiber.New(fiber.Config{
		// Error-Handler für die zentrale Fehlerbehandlung
		ErrorHandler: func(c *fiber.Ctx, err error) error {
			code := fiber.StatusInternalServerError
			message := "interner Serverfehler"

			// Wenn es ein Fiber-Fehler ist, den Statuscode und die Nachricht extrahieren
			if e, ok := err.(*fiber.Error); ok {
				code = e.Code
				message = e.Message
			}

			// Fehler protokollieren
			log.Printf("Fehler: %v", err)

			// Fehlerantwort als JSON zurückgeben
			return c.Status(code).JSON(fiber.Map{
				"error": message,
			})
		},
		ReadTimeout:  time.Second * 30,  // Timeout für das Lesen des Anfragekörpers
		WriteTimeout: time.Second * 30,  // Timeout für das Schreiben der Antwort
		IdleTimeout:  time.Second * 120, // Timeout für inaktive Verbindungen
	})

	// Middleware und Routen einrichten
	setupMiddleware(app)
	setupRoutes(app, handlers)

	// Anmutiges Herunterfahren einrichten
	gracefulShutdown(app)

	// Server starten
	port := getEnv("PORT", "3030") // Port aus Umgebungsvariable oder Standardport 3030

	// Server an angegebenem Port lauschen
	if err := app.Listen(":" + port); err != nil {
		log.Fatalf("server konnte nicht gestartet werden: %v", err)
	}
}
