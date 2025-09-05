# Multi-stage build für TrustMe Backend
FROM golang:1.21-alpine AS builder

# Arbeitsverzeichnis setzen
WORKDIR /app

# Go Module Dateien kopieren
COPY go.mod go.sum ./

# Dependencies herunterladen
RUN go mod download

# Source Code kopieren
COPY . .

# Binary bauen
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o main .

# Production Stage
FROM alpine:latest

# CA Zertifikate für HTTPS
RUN apk --no-cache add ca-certificates tzdata

# Arbeitsverzeichnis
WORKDIR /root/

# Binary aus Builder Stage kopieren
COPY --from=builder /app/main .

# Port freigeben
EXPOSE 3030

# Health Check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3030/health || exit 1

# Anwendung starten
CMD ["./main"]