# Multi-Stage Dockerfile für TrustMe React-Frontend
# Optimiert für minimale Production-Image-Größe und Development-Velocity
# Builder für Vite-Build, Nginx für Production-Serving

# Builder Stage: Node.js für React/Vite-Kompilierung
FROM node:18-alpine AS builder

# Git für NPM-Packages die Git-Repos referenzieren
RUN apk add --no-cache git

# Build-Arbeitsverzeichnis festlegen
WORKDIR /app

# Package-Manifeste zuerst kopieren (Docker Layer-Caching)
COPY package*.json ./

# Production-Dependencies installieren (ohne dev-Dependencies)
# --ci für reproduzierbare Builds, Flags für schnellere Installation
RUN npm ci --only=production --no-audit --no-fund

# Gesamten Source-Code kopieren (nach Dependencies für besseres Caching)
COPY . .

# Vite Production-Build: Optimierte, minifizierte Assets
# Erstellt dist/ Verzeichnis mit statischen Dateien für Nginx
# Vite Build -> /app/dist/
RUN npm run build

# Production Stage: Nginx für hochperformantes Static-File-Serving
# Alpine-basiert für minimale Image-Größe und Security
FROM nginx:alpine AS production

# Sicherheit: Dedicated nginx-User mit minimalen Rechten
# Vermeidet Root-Ausführung für bessere Container-Security
RUN addgroup -g 1001 -S nginx && \
    adduser -S -D -H -u 1001 -h /var/cache/nginx -s /sbin/nologin -G nginx -g nginx nginx

# Vite-Build-Output von Builder-Stage kopieren
# /dist -> Nginx-Standard-Verzeichnis für statische Dateien
COPY --from=builder /app/dist /usr/share/nginx/html

# Optimierte Nginx-Konfiguration für SPA-Routing und Performance
COPY nginx.conf /etc/nginx/conf.d/default.conf

# File-Permissions für nginx-User setzen (Security Best Practice)
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    chown -R nginx:nginx /etc/nginx/conf.d

# HTTP-Port für Frontend-Zugriff
# Standard HTTP-Port
EXPOSE 80

# Container-Gesundheitsprüfung für Orchestrierung
# Prüft ob Nginx reagiert und React-App erreichbar ist
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:80/ || exit 1

# Non-Root-Ausführung für Container-Security
USER nginx

# Nginx im Foreground starten (Docker-konform)
# -g daemon off verhindert Background-Modus
CMD ["nginx", "-g", "daemon off;"]

# Development Stage: Feature-reiche Umgebung für lokale Entwicklung
# Enthält Vite Dev-Server mit Hot-Module-Replacement (HMR)
FROM node:18-alpine AS development

# Development-Tools für Debugging und Testing
# Git + HTTP-Tools für API-Tests
RUN apk add --no-cache git curl

# Development-Arbeitsverzeichnis
WORKDIR /app

# Package-Dateien für Dependency-Installation
COPY package*.json ./

# Alle Dependencies installieren (Production + Development)
# Inklusive Testing-Tools, Linter, Type-Checker
# Vollständige Installation für Development
RUN npm install

# Source-Code für Live-Editing (wird via Volume gemountet)
COPY . .

# Vite Dev-Server Port
# Vite Default-Port
EXPOSE 5173

# Vite Development-Server mit HMR starten
# --host 0.0.0.0 ermöglicht Container-externe Zugriffe
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]