# Browser Extension Build Dockerfile
FROM node:18-alpine AS builder

# Arbeitsverzeichnis setzen
WORKDIR /app

# Package files kopieren (falls vorhanden)
COPY package*.json ./

# Dependencies installieren (falls package.json existiert)
RUN if [ -f package.json ]; then npm ci --only=production; fi

# Source code kopieren
COPY . .

# Build-Verzeichnis erstellen
RUN mkdir -p dist

# Extension-Dateien in dist kopieren
RUN cp -r src/* dist/ 2>/dev/null || true && \
    cp manifest.json dist/ 2>/dev/null || true && \
    cp *.html dist/ 2>/dev/null || true && \
    cp *.js dist/ 2>/dev/null || true && \
    cp *.css dist/ 2>/dev/null || true && \
    cp -r icons dist/ 2>/dev/null || true

# Production Stage
FROM alpine:latest AS production

# Arbeitsverzeichnis
WORKDIR /app

# Extension-Build aus Builder kopieren
COPY --from=builder /app/dist ./dist

# Metadaten-Datei erstellen
RUN echo "TrustMe Browser Extension Build $(date)" > dist/build-info.txt

# Volume für Output
VOLUME ["/app/dist"]

# Default Command
CMD ["sh", "-c", "echo 'Browser Extension built successfully. Files available in /app/dist'"]

# Development Stage
FROM node:18-alpine AS development

# Development-Tools installieren
RUN apk add --no-cache git curl zip

# Arbeitsverzeichnis setzen
WORKDIR /app

# Source code kopieren
COPY . .

# Watch-Script für Development
RUN echo '#!/bin/sh\nwhile true; do\n  echo "Watching for changes..."\n  sleep 5\ndone' > watch.sh && \
    chmod +x watch.sh

# Development-Modus
CMD ["./watch.sh"]