# Multi-stage build für TrustMe Frontend
FROM node:18-alpine AS builder

# Arbeitsverzeichnis setzen
WORKDIR /app

# Package files kopieren
COPY package*.json ./

# Dependencies installieren
RUN npm ci --only=production

# Source code kopieren
COPY . .

# Build für Production
RUN npm run build

# Production stage mit nginx
FROM nginx:alpine

# Build files kopieren
COPY --from=builder /app/dist /usr/share/nginx/html

# Nginx Konfiguration kopieren
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Port freigeben
EXPOSE 80

# Health Check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:80/ || exit 1

# Nginx starten
CMD ["nginx", "-g", "daemon off;"] 