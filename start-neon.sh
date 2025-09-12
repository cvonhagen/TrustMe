#!/bin/bash

# TrustMe Password Manager - Neon Database Startup Script
# Startet die Anwendung mit externer Neon PostgreSQL Datenbank

set -e

# Farben für Output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${BLUE}[NEON-START]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Prüfe ob .env.neon existiert
check_env_file() {
    if [ ! -f ".env.neon" ]; then
        warning ".env.neon Datei nicht gefunden!"
        echo "Erstelle .env.neon mit deiner Neon Database URL:"
        echo "DATABASE_URL=postgresql://username:password@ep-example.us-east-1.aws.neon.tech/neondb?sslmode=require"
        exit 1
    fi
}

# Environment Datei kopieren
setup_env() {
    log "Kopiere Neon Environment Konfiguration..."
    cp .env.neon .env
    success "Environment konfiguriert"
}

# Docker Services starten
start_services() {
    log "Starte TrustMe Services mit Neon Database..."
    echo "🚀 Starting TrustMe with Neon DB..."
    docker-compose up --build -d
    success "Services gestartet!"
}

# Service Status prüfen
check_status() {
    log "Prüfe Service Status..."
    sleep 5
    
    # Backend Health Check
    if curl -f http://localhost:8080/health >/dev/null 2>&1; then
        success "Backend ist erreichbar: http://localhost:8080/health"
    else
        warning "Backend Health Check fehlgeschlagen"
    fi
    
    echo ""
    echo "=== TrustMe Services ==="
    echo "Frontend:  http://localhost:3000"
    echo "Backend:   http://localhost:8080"
    echo "API Docs:  http://localhost:8080/api/v1"
    echo "MailHog:   http://localhost:8025 (mit --profile dev)"
    echo ""
}

# Logs anzeigen
show_logs() {
    if [ "$1" == "--logs" ]; then
        log "Zeige Service Logs..."
        docker compose -f docker-compose.neon.yml logs -f
        exit 0
    fi
}

# Services stoppen
stop_services() {
    if [ "$1" == "--stop" ]; then
        log "Stoppe Services..."
        docker compose -f docker-compose.neon.yml down
        success "Services gestoppt"
        exit 0
    fi
}

# Main Funktion
main() {
    echo -e "${BLUE}"
    echo "========================================="
    echo "  TrustMe mit Neon Database"
    echo "========================================="
    echo -e "${NC}"
    
    # Command Line Optionen
    show_logs "$1"
    stop_services "$1"
    
    # Setup und Start
    check_env_file
    setup_env
    start_services
    check_status
    
    echo "Verwende folgende Commands:"
    echo "  ./start-neon.sh --logs   # Logs anzeigen"
    echo "  ./start-neon.sh --stop   # Services stoppen"
    echo ""
}

# Script ausführen
main "$@"
