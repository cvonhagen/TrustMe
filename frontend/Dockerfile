# Build-Stage
FROM node:18-alpine as build

# Setze Arbeitsverzeichnis
WORKDIR /app

# Kopiere package.json und package-lock.json
COPY package*.json ./

# Installiere Abhängigkeiten
RUN npm ci

# Kopiere den Rest der Anwendung
COPY . .

# Baue die Anwendung
RUN npm run build

# Produktions-Stage
FROM nginx:alpine

# Kopiere die Build-Dateien aus dem Build-Stage
COPY --from=build /app/dist /usr/share/nginx/html

# Kopiere die Nginx-Konfiguration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Exponiere Port 80
EXPOSE 80

# Starte Nginx
CMD ["nginx", "-g", "daemon off;"] 