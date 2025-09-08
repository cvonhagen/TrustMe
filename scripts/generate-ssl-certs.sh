#!/bin/bash

# TrustMe Password Manager - SSL Certificate Generation Script
# Erstellt selbstsignierte SSL-Zertifikate für lokale Entwicklung

set -e

# Farben für Output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${BLUE}[SSL-CERT]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Konfiguration
CERT_DIR="./nginx/ssl"
DOMAIN="trustme.local"
DAYS=365

# Erstelle SSL-Verzeichnis
create_ssl_directory() {
    log "Erstelle SSL-Verzeichnis: $CERT_DIR"
    mkdir -p "$CERT_DIR"
}

# Generiere Private Key
generate_private_key() {
    log "Generiere Private Key..."
    openssl genrsa -out "$CERT_DIR/trustme.key" 2048
    chmod 600 "$CERT_DIR/trustme.key"
}

# Erstelle Certificate Signing Request (CSR)
create_csr() {
    log "Erstelle Certificate Signing Request..."
    
    # CSR Config erstellen
    cat > "$CERT_DIR/csr.conf" <<EOF
[req]
default_bits = 2048
prompt = no
default_md = sha256
distinguished_name = dn
req_extensions = v3_req

[dn]
C=DE
ST=Germany
L=Berlin
O=TrustMe Password Manager
OU=Development
CN=$DOMAIN

[v3_req]
basicConstraints = CA:FALSE
keyUsage = nonRepudiation, digitalSignature, keyEncipherment
subjectAltName = @alt_names

[alt_names]
DNS.1 = $DOMAIN
DNS.2 = localhost
DNS.3 = *.trustme.local
IP.1 = 127.0.0.1
IP.2 = ::1
EOF

    # CSR generieren
    openssl req -new -key "$CERT_DIR/trustme.key" -out "$CERT_DIR/trustme.csr" -config "$CERT_DIR/csr.conf"
}

# Generiere selbstsigniertes Zertifikat
generate_certificate() {
    log "Generiere selbstsigniertes SSL-Zertifikat..."
    
    # Certificate Config erstellen
    cat > "$CERT_DIR/cert.conf" <<EOF
[req]
default_bits = 2048
prompt = no
default_md = sha256
distinguished_name = dn
x509_extensions = v3_ca

[dn]
C=DE
ST=Germany
L=Berlin
O=TrustMe Password Manager
OU=Development
CN=$DOMAIN

[v3_ca]
basicConstraints = critical,CA:TRUE
keyUsage = critical, digitalSignature, keyEncipherment, keyCertSign
subjectAltName = @alt_names
subjectKeyIdentifier = hash
authorityKeyIdentifier = keyid:always,issuer:always

[alt_names]
DNS.1 = $DOMAIN
DNS.2 = localhost
DNS.3 = *.trustme.local
IP.1 = 127.0.0.1
IP.2 = ::1
EOF

    # Zertifikat generieren
    openssl x509 -req -in "$CERT_DIR/trustme.csr" -signkey "$CERT_DIR/trustme.key" \
        -out "$CERT_DIR/trustme.crt" -days $DAYS -extensions v3_ca -extfile "$CERT_DIR/cert.conf"
}

# Zertifikat-Informationen anzeigen
show_certificate_info() {
    log "Zertifikat-Informationen:"
    openssl x509 -in "$CERT_DIR/trustme.crt" -text -noout | grep -A 1 "Subject:"
    openssl x509 -in "$CERT_DIR/trustme.crt" -text -noout | grep -A 1 "Not Before:"
    openssl x509 -in "$CERT_DIR/trustme.crt" -text -noout | grep -A 1 "Not After:"
    openssl x509 -in "$CERT_DIR/trustme.crt" -text -noout | grep -A 5 "Subject Alternative Name:"
}

# Cleanup temporäre Dateien
cleanup() {
    log "Cleanup temporäre Dateien..."
    rm -f "$CERT_DIR/trustme.csr" "$CERT_DIR/csr.conf" "$CERT_DIR/cert.conf"
}

# Installationshinweise
show_installation_hints() {
    echo ""
    success "=== SSL-Zertifikate erfolgreich erstellt ==="
    echo ""
    echo "Dateien erstellt:"
    echo "  - $CERT_DIR/trustme.key (Private Key)"
    echo "  - $CERT_DIR/trustme.crt (Zertifikat)"
    echo ""
    warning "WICHTIGE HINWEISE:"
    echo ""
    echo "1. Hosts-Datei aktualisieren:"
    echo "   Füge folgende Zeile zu /etc/hosts (Linux/Mac) oder C:\\Windows\\System32\\drivers\\etc\\hosts (Windows) hinzu:"
    echo "   127.0.0.1 trustme.local"
    echo ""
    echo "2. Zertifikat im Browser vertrauen:"
    echo "   - Chrome: Gehe zu chrome://settings/certificates"
    echo "   - Firefox: Gehe zu about:preferences#privacy -> Zertifikate anzeigen"
    echo "   - Importiere $CERT_DIR/trustme.crt als vertrauenswürdige Zertifizierungsstelle"
    echo ""
    echo "3. Docker Compose starten:"
    echo "   docker-compose -f docker-compose.prod.yml up -d"
    echo ""
    echo "4. Anwendung öffnen:"
    echo "   https://trustme.local"
    echo ""
}

# Prüfe ob OpenSSL installiert ist
check_openssl() {
    if ! command -v openssl &> /dev/null; then
        echo "ERROR: OpenSSL ist nicht installiert."
        echo "Installiere OpenSSL:"
        echo "  - Ubuntu/Debian: sudo apt-get install openssl"
        echo "  - macOS: brew install openssl"
        echo "  - Windows: Verwende Git Bash oder WSL"
        exit 1
    fi
}

# Main Funktion
main() {
    echo -e "${BLUE}"
    echo "========================================="
    echo "  TrustMe SSL Certificate Generator"
    echo "========================================="
    echo -e "${NC}"
    
    check_openssl
    create_ssl_directory
    generate_private_key
    create_csr
    generate_certificate
    show_certificate_info
    cleanup
    show_installation_hints
}

# Script ausführen
main "$@"
