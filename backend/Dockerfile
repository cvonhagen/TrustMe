# Multi-stage build für TrustMe Backend
FROM golang:1.24-alpine AS builder

# Build-Tools installieren
RUN apk add --no-cache git ca-certificates tzdata

# Arbeitsverzeichnis setzen
WORKDIR /app

# Go Module Dateien kopieren
COPY go.mod go.sum ./

# Dependencies herunterladen mit Proxy für bessere Performance
RUN go env -w GOPROXY=https://proxy.golang.org,direct && \
    go mod download && \
    go mod verify

# Source Code kopieren
COPY . .

# Binary bauen mit Optimierungen
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build \
    -a -installsuffix cgo \
    -ldflags='-w -s -extldflags "-static"' \
    -o main .

# Production Stage
FROM scratch AS production

# CA Zertifikate und Timezone-Daten aus Builder kopieren
COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/
COPY --from=builder /usr/share/zoneinfo /usr/share/zoneinfo

# Binary aus Builder Stage kopieren
COPY --from=builder /app/main /main

# Port freigeben
EXPOSE 8080

# Benutzer-ID für Security
USER 65534:65534

# Health Check (ohne spezielle Health Check Flags)
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/health || exit 1

# Anwendung starten
ENTRYPOINT ["/main"]

# Development Stage (für lokale Entwicklung)
FROM golang:1.25-alpine AS development

# Development-Tools installieren
RUN apk add --no-cache git ca-certificates tzdata curl wget

# Air für Hot Reload installieren (neues Repository)
RUN go install github.com/air-verse/air@latest

# Arbeitsverzeichnis setzen
WORKDIR /app

# Go Module Dateien kopieren
COPY go.mod go.sum ./

# Dependencies herunterladen
RUN go mod download

# Source Code kopieren
COPY . .

# Port freigeben
EXPOSE 8080

# Development-Server mit Hot Reload starten
CMD ["air", "-c", ".air.toml"]