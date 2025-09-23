# 30-Tage Account-Löschung - Implementierungsübersicht

## ✅ Was ist bereits implementiert

### 🗃️ Backend (Go)

#### Models (models/models.go)
- ✅ `DeletedAt *time.Time` - Zeitstempel der Löschung
- ✅ `DeletionScheduledAt *time.Time` - Geplante endgültige Löschung

#### User Service (services/user_service.go)
- ✅ `ScheduleAccountDeletion()` - Markiert Account für Löschung (30 Tage)
- ✅ `RestoreAccount()` - Stellt Account innerhalb 30 Tage wieder her  
- ✅ `PermanentlyDeleteExpiredAccounts()` - Löscht abgelaufene Accounts
- ✅ Alle User-Queries berücksichtigen `deleted_at IS NULL`

#### Auth Service (services/auth_service.go)
- ✅ `ScheduleAccountDeletion()` - Wrapper für UserService

#### Handlers (handlers/auth_handler.go & user_handler.go)
- ✅ `DeleteAccount()` - Verwendet jetzt Soft Delete
- ✅ `RestoreAccount()` - Neue Route für Wiederherstellung

#### Cleanup Service (services/cleanup_service.go)
- ✅ Automatischer täglicher Cleanup um 02:00 Uhr
- ✅ `StartCleanupScheduler()` - Startet automatischen Scheduler
- ✅ `RunAccountCleanup()` - Manuelle Cleanup-Ausführung
- ✅ Test-Route `/api/v1/test/cleanup-accounts` (nur Development)

#### Routen (main.go)
- ✅ `DELETE /api/v1/users/account` - Soft Delete
- ✅ `POST /api/v1/users/account/restore` - Wiederherstellung
- ✅ `DELETE /api/v1/auth/account` - Soft Delete (Alternative Route)

### 🎨 Frontend (React)

#### Settings Page (SettingsPage.jsx)
- ✅ **30-Tage-Hinweis** im Löschungsdialog
- ✅ Doppelte Bestätigung erforderlich
- ✅ Klare Warnung über betroffene Daten
- ✅ Automatisches Logout nach Löschung
- ✅ Erfolgs-/Fehlermeldungen

#### API Integration (services/api.js)
- ✅ DELETE Request an `/api/v1/users/account`
- ✅ Fehlerbehandlung implementiert

## 🔄 Wie es funktioniert

### 1. Account löschen
```
User klickt "Account löschen"
→ Doppelte Bestätigung im Frontend
→ API Call: DELETE /api/v1/users/account
→ Backend: ScheduleAccountDeletion(userID)
→ Setzt deleted_at = jetzt, deletion_scheduled_at = jetzt + 30 Tage
```

### 2. Während der 30 Tage
```
- User kann sich NICHT mehr einloggen (deleted_at IS NOT NULL Filter)
- Daten bleiben in der Datenbank
- Account kann mit POST /api/v1/users/account/restore wiederhergestellt werden
```

### 3. Nach 30 Tagen
```
Täglicher Cleanup um 02:00 Uhr:
→ Findet alle User mit deletion_scheduled_at < jetzt
→ Löscht zuerst alle Passwörter des Users
→ Löscht dann den User permanent (UNSCOPED DELETE)
```

## 🧪 Testen

### Manueller Test
```bash
# Account für Löschung markieren
curl -X DELETE http://localhost:8080/api/v1/users/account \
  -H "Authorization: Bearer YOUR_TOKEN"

# Account wiederherstellen (innerhalb 30 Tage)
curl -X POST http://localhost:8080/api/v1/users/account/restore \
  -H "Authorization: Bearer YOUR_TOKEN"

# Manueller Cleanup (Development)
curl -X POST http://localhost:8080/api/v1/test/cleanup-accounts
```

### Frontend Test
1. Gehe zu Settings → Account löschen
2. Bestätige zweimal
3. Account wird mit 30-Tage-Meldung gelöscht
4. Automatisches Logout erfolgt

## 📋 Checkliste - Alles implementiert ✅

- [x] **Datenbank-Schema**: DeletedAt + DeletionScheduledAt Felder
- [x] **Soft Delete Logic**: ScheduleAccountDeletion Methode
- [x] **Wiederherstellung**: RestoreAccount Methode
- [x] **Automatischer Cleanup**: Täglicher Scheduler um 02:00 Uhr
- [x] **Frontend UI**: 30-Tage-Hinweis in Settings
- [x] **API-Endpunkte**: /users/account/restore Route
- [x] **Filtered Queries**: Alle User-Queries berücksichtigen deleted_at
- [x] **Auth-Integration**: Login blockiert für gelöschte User
- [x] **Error Handling**: Korrekte Fehlermeldungen
- [x] **Development Tools**: Test-Route für manuellen Cleanup

## 🎯 Ergebnis

Die 30-Tage-Löschung ist **vollständig implementiert** und funktioniert wie folgt:

1. **Benutzerfreundlich**: Klare 30-Tage-Warnung im Frontend
2. **Sicher**: Doppelte Bestätigung erforderlich  
3. **Flexibel**: Wiederherstellung innerhalb 30 Tage möglich
4. **Automatisch**: Tägliche Bereinigung abgelaufener Accounts
5. **GDPR-konform**: Vollständige Datenlöschung nach 30 Tagen

**Die 30-Tage-Funktion ist vollständig einsatzbereit!** 🎉