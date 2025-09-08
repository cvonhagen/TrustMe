# Multi-stage build für TrustMe Frontend
FROM node:18-alpine AS builder

# Build-Tools installieren
RUN apk add --no-cache git

# Arbeitsverzeichnis setzen
WORKDIR /app

# Package files kopieren
COPY package*.json ./

# Dependencies installieren mit Cache-Optimierung
RUN npm ci --only=production --no-audit --no-fund

# Source code kopieren
COPY . .

# Build für Production mit Optimierungen
RUN npm run build

# Production stage mit nginx
FROM nginx:alpine AS production

# Security: Non-root user erstellen
RUN addgroup -g 1001 -S nginx && \
    adduser -S -D -H -u 1001 -h /var/cache/nginx -s /sbin/nologin -G nginx -g nginx nginx

# Build files kopieren
COPY --from=builder /app/dist /usr/share/nginx/html

# Nginx Konfiguration kopieren
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Berechtigungen setzen
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    chown -R nginx:nginx /etc/nginx/conf.d

# Port freigeben
EXPOSE 80

# Health Check
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:80/ || exit 1

# Als nginx user ausführen
USER nginx

# Nginx starten
CMD ["nginx", "-g", "daemon off;"]

# Development Stage (für lokale Entwicklung)
FROM node:18-alpine AS development

# Development-Tools installieren
RUN apk add --no-cache git curl

# Arbeitsverzeichnis setzen
WORKDIR /app

# Package files kopieren
COPY package*.json ./

# Alle Dependencies installieren (inkl. dev)
RUN npm install

# Source code kopieren
COPY . .

# Port freigeben
EXPOSE 5173

# Development-Server starten
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]