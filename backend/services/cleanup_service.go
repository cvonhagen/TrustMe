package services

import (
	"backend/models"
	"log"
	"time"

	"gorm.io/gorm"
)

// CleanupService handles automated cleanup tasks
type CleanupService struct {
	DB          *gorm.DB
	UserService *UserService
}

// NewCleanupService creates a new CleanupService instance
func NewCleanupService(db *gorm.DB, userService *UserService) *CleanupService {
	return &CleanupService{
		DB:          db,
		UserService: userService,
	}
}

// StartCleanupScheduler startet den automatischen Cleanup-Scheduler
// Läuft täglich um 02:00 Uhr und löscht abgelaufene Accounts
func (s *CleanupService) StartCleanupScheduler() {
	go func() {
		for {
			// Berechne Zeit bis zum nächsten 02:00 Uhr
			now := time.Now()
			next := time.Date(now.Year(), now.Month(), now.Day(), 2, 0, 0, 0, now.Location())
			
			// Falls es schon nach 02:00 Uhr ist, nimm den nächsten Tag
			if now.After(next) {
				next = next.AddDate(0, 0, 1)
			}
			
			duration := next.Sub(now)
			log.Printf("Nächster Account-Cleanup läuft in %v (um %v)", duration, next.Format("2006-01-02 15:04:05"))
			
			// Warte bis zum nächsten Cleanup
			time.Sleep(duration)
			
			// Führe Cleanup aus
			s.RunAccountCleanup()
		}
	}()
}

// RunAccountCleanup führt den Account-Cleanup manuell aus
func (s *CleanupService) RunAccountCleanup() {
	log.Println("Starte automatischen Account-Cleanup...")
	
	// Finde alle Accounts die gelöscht werden sollen
	var expiredUsers []models.User
	now := time.Now()
	
	result := s.DB.Unscoped().Where("deleted_at IS NOT NULL AND deletion_scheduled_at < ?", now).Find(&expiredUsers)
	if result.Error != nil {
		log.Printf("Fehler beim Suchen abgelaufener Accounts: %v", result.Error)
		return
	}
	
	if len(expiredUsers) == 0 {
		log.Println("Keine abgelaufenen Accounts gefunden")
		return
	}
	
	log.Printf("Gefunden: %d abgelaufene Accounts", len(expiredUsers))
	
	// Lösche jeden abgelaufenen Account
	deletedCount := 0
	for _, user := range expiredUsers {
		err := s.permanentlyDeleteUser(user.ID)
		if err != nil {
			log.Printf("Fehler beim Löschen von User %d (%s): %v", user.ID, user.Username, err)
		} else {
			log.Printf("User %d (%s) erfolgreich permanent gelöscht", user.ID, user.Username)
			deletedCount++
		}
	}
	
	log.Printf("Account-Cleanup abgeschlossen: %d von %d Accounts erfolgreich gelöscht", deletedCount, len(expiredUsers))
}

// permanentlyDeleteUser löscht einen User und alle zugehörigen Daten permanent
func (s *CleanupService) permanentlyDeleteUser(userID uint) error {
	// Lösche zuerst alle Passwörter des Users
	if err := s.DB.Unscoped().Where("user_id = ?", userID).Delete(&models.Password{}).Error; err != nil {
		return err
	}
	
	// Lösche dann den User permanent
	if err := s.DB.Unscoped().Delete(&models.User{}, userID).Error; err != nil {
		return err
	}
	
	return nil
}

// GetScheduledDeletionStats gibt Statistiken über geplante Löschungen zurück
func (s *CleanupService) GetScheduledDeletionStats() (map[string]interface{}, error) {
	var totalScheduled, expiredCount int64
	now := time.Now()
	
	// Zähle alle zum Löschen markierten Accounts
	if err := s.DB.Model(&models.User{}).Where("deleted_at IS NOT NULL").Count(&totalScheduled).Error; err != nil {
		return nil, err
	}
	
	// Zähle bereits abgelaufene Accounts
	if err := s.DB.Unscoped().Model(&models.User{}).Where("deleted_at IS NOT NULL AND deletion_scheduled_at < ?", now).Count(&expiredCount).Error; err != nil {
		return nil, err
	}
	
	return map[string]interface{}{
		"total_scheduled_for_deletion": totalScheduled,
		"expired_accounts":             expiredCount,
		"pending_deletion":             totalScheduled - expiredCount,
		"next_cleanup":                 "02:00 Uhr täglich",
	}, nil
}