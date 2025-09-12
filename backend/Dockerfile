# Multi-Stage Dockerfile für TrustMe Go-Backend
# Optimiert für Produktions-Performance und Entwickler-Erfahrung
# Verwendet Alpine Linux für minimale Image-Größe und Sicherheit

# Builder Stage: Kompiliert Go-Binary mit optimierten Einstellungen
FROM golang:1.24-alpine AS builder

# Essentielle Build-Tools für Go-Kompilierung installieren
RUN apk add --no-cache git ca-certificates tzdata  # Git für Module, CA-Certs für HTTPS, Timezone-Daten

# Arbeitsverzeichnis für Build-Prozess definieren
WORKDIR /app

# Go Module-Manifest zuerst kopieren (für Docker Layer-Caching)
COPY go.mod go.sum ./

# Dependencies mit optimiertem Proxy herunterladen
# Proxy beschleunigt Downloads und ermöglicht Offline-Caching
RUN go env -w GOPROXY=https://proxy.golang.org,direct && \
    go mod download && \
    go mod verify                    # Integritätsprüfung der Dependencies

# Gesamten Source-Code kopieren (nach Dependency-Download für besseres Caching)
COPY . .

# Optimiertes statisches Binary erstellen
# CGO_ENABLED=0: Keine C-Dependencies für bessere Portabilität
# -ldflags: Strip Debug-Info und Symbole für kleinere Binary-Größe
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build \
    -a -installsuffix cgo \
    -ldflags='-w -s -extldflags "-static"' \
    -o main .                        # Output: /app/main executable

# Production Stage: Minimales Scratch-Image für höchste Sicherheit
# Scratch = leeres Image ohne OS-Layer (nur unser Binary)
FROM scratch AS production

# Essentielle System-Dateien aus Builder kopieren
COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/  # HTTPS-Zertifikate
COPY --from=builder /usr/share/zoneinfo /usr/share/zoneinfo              # Timezone-Unterstützung

# Kompiliertes Binary aus Builder-Stage kopieren
COPY --from=builder /app/main /main

# Container-Port für Backend-API definieren
EXPOSE 8080                          # HTTP-Port für Fiber-Server

# Sicherheit: Non-Root-User (nobody:nogroup)
USER 65534:65534                     # UID:GID für minimale Berechtigungen

# Automatische Gesundheitsprüfung für Container-Orchestrierung
# Ermöglicht automatisches Restart bei API-Ausfällen
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/health || exit 1

# Container-Startbefehl: Direkte Binary-Ausführung
ENTRYPOINT ["/main"]                  # Kein Shell-Wrapper für bessere Performance

# Development Stage: Feature-reiche Umgebung für lokale Entwicklung
# Enthält Hot-Reload, Debugging-Tools und Development-Dependencies
FROM golang:1.25-alpine AS development  # Neuere Go-Version für Development

# Development-Tools für produktive Entwicklung
RUN apk add --no-cache git ca-certificates tzdata curl wget  # Basis-Tools + HTTP-Clients

# Air Hot-Reload-Tool für automatische Neukompilierung bei Code-Änderungen
# Beschleunigt Entwicklungszyklus erheblich
RUN go install github.com/air-verse/air@latest

# Development-Arbeitsverzeichnis
WORKDIR /app

# Go Modules für Dependency-Management
COPY go.mod go.sum ./

# Dependencies für Development herunterladen
RUN go mod download                   # Ohne Verifikation für schnellere Dev-Zyklen

# Source-Code für Live-Editing mounten (via docker-compose volumes)
COPY . .

# Development-Port (identisch mit Production)
EXPOSE 8080

# Hot-Reload-Server mit Air starten
# Automatische Neukompilierung bei Dateiänderungen
CMD ["air", "-c", ".air.toml"]          # Air-Konfiguration aus .air.toml