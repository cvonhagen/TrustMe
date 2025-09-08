#!/bin/bash

# TrustMe Password Manager - Azure Resources Setup Script
# Erstellt alle notwendigen Azure-Ressourcen vor dem ersten Deployment

set -e

# Farben für Output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${BLUE}[SETUP]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Konfiguration
APP_NAME="trustme"
LOCATION="West Europe"
SUBSCRIPTION_ID=""

# Environments
ENVIRONMENTS=("staging" "prod")

# Prüfe Azure CLI
check_azure_cli() {
    if ! command -v az &> /dev/null; then
        error "Azure CLI ist nicht installiert."
        echo "Installiere von: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli"
        exit 1
    fi
}

# Azure Login
azure_login() {
    log "Prüfe Azure Login..."
    if ! az account show &> /dev/null; then
        warning "Nicht angemeldet. Starte Login..."
        az login
    fi
    
    if [ -z "$SUBSCRIPTION_ID" ]; then
        SUBSCRIPTION_ID=$(az account show --query id -o tsv)
        log "Verwende Subscription: $SUBSCRIPTION_ID"
    else
        az account set --subscription "$SUBSCRIPTION_ID"
    fi
}

# Resource Groups erstellen
create_resource_groups() {
    for env in "${ENVIRONMENTS[@]}"; do
        local rg_name="${APP_NAME}-${env}-rg"
        log "Erstelle Resource Group: $rg_name"
        
        az group create \
            --name "$rg_name" \
            --location "$LOCATION" \
            --tags \
                Environment="$env" \
                Project="TrustMe" \
                Owner="$(az account show --query user.name -o tsv)" \
            --output table
    done
}

# Container Registries erstellen
create_container_registries() {
    for env in "${ENVIRONMENTS[@]}"; do
        local rg_name="${APP_NAME}-${env}-rg"
        local acr_name="${APP_NAME}registry${env}$(openssl rand -hex 3)"
        
        log "Erstelle Container Registry: $acr_name"
        
        az acr create \
            --resource-group "$rg_name" \
            --name "$acr_name" \
            --sku Basic \
            --admin-enabled true \
            --tags \
                Environment="$env" \
                Project="TrustMe" \
            --output table
        
        # Registry-Name für spätere Verwendung speichern
        echo "$acr_name" > ".azure-registry-${env}.txt"
        success "Registry erstellt: $acr_name"
    done
}

# Key Vaults erstellen
create_key_vaults() {
    for env in "${ENVIRONMENTS[@]}"; do
        local rg_name="${APP_NAME}-${env}-rg"
        local kv_name="${APP_NAME}-${env}-kv-$(openssl rand -hex 3)"
        
        log "Erstelle Key Vault: $kv_name"
        
        az keyvault create \
            --name "$kv_name" \
            --resource-group "$rg_name" \
            --location "$LOCATION" \
            --enable-rbac-authorization true \
            --tags \
                Environment="$env" \
                Project="TrustMe" \
            --output table
        
        # Key Vault-Name speichern
        echo "$kv_name" > ".azure-keyvault-${env}.txt"
        success "Key Vault erstellt: $kv_name"
    done
}

# Log Analytics Workspaces erstellen
create_log_analytics() {
    for env in "${ENVIRONMENTS[@]}"; do
        local rg_name="${APP_NAME}-${env}-rg"
        local workspace_name="${APP_NAME}-${env}-logs"
        
        log "Erstelle Log Analytics Workspace: $workspace_name"
        
        az monitor log-analytics workspace create \
            --workspace-name "$workspace_name" \
            --resource-group "$rg_name" \
            --location "$LOCATION" \
            --tags \
                Environment="$env" \
                Project="TrustMe" \
            --output table
        
        success "Log Analytics Workspace erstellt: $workspace_name"
    done
}

# PostgreSQL Flexible Servers erstellen
create_postgresql_servers() {
    for env in "${ENVIRONMENTS[@]}"; do
        local rg_name="${APP_NAME}-${env}-rg"
        local server_name="${APP_NAME}-${env}-db"
        local admin_user="trustmeadmin"
        local admin_password=$(openssl rand -base64 24 | tr -d "=+/" | cut -c1-16)
        
        log "Erstelle PostgreSQL Server: $server_name"
        
        az postgres flexible-server create \
            --name "$server_name" \
            --resource-group "$rg_name" \
            --location "$LOCATION" \
            --admin-user "$admin_user" \
            --admin-password "$admin_password" \
            --sku-name Standard_B1ms \
            --tier Burstable \
            --storage-size 32 \
            --version 15 \
            --tags \
                Environment="$env" \
                Project="TrustMe" \
            --output table
        
        # Database erstellen
        az postgres flexible-server db create \
            --resource-group "$rg_name" \
            --server-name "$server_name" \
            --database-name "trustme"
        
        # Firewall-Regel für Azure Services
        az postgres flexible-server firewall-rule create \
            --resource-group "$rg_name" \
            --name "$server_name" \
            --rule-name "AllowAzureServices" \
            --start-ip-address 0.0.0.0 \
            --end-ip-address 0.0.0.0
        
        # Credentials speichern
        echo "Server: $server_name" > ".azure-db-${env}.txt"
        echo "Admin User: $admin_user" >> ".azure-db-${env}.txt"
        echo "Admin Password: $admin_password" >> ".azure-db-${env}.txt"
        
        success "PostgreSQL Server erstellt: $server_name"
        warning "DB Credentials gespeichert in: .azure-db-${env}.txt"
    done
}

# Container Apps Environments erstellen
create_container_app_environments() {
    for env in "${ENVIRONMENTS[@]}"; do
        local rg_name="${APP_NAME}-${env}-rg"
        local env_name="${APP_NAME}-${env}-env"
        local workspace_name="${APP_NAME}-${env}-logs"
        
        log "Erstelle Container Apps Environment: $env_name"
        
        # Workspace ID abrufen
        local workspace_id=$(az monitor log-analytics workspace show \
            --workspace-name "$workspace_name" \
            --resource-group "$rg_name" \
            --query customerId -o tsv)
        
        local workspace_key=$(az monitor log-analytics workspace get-shared-keys \
            --workspace-name "$workspace_name" \
            --resource-group "$rg_name" \
            --query primarySharedKey -o tsv)
        
        az containerapp env create \
            --name "$env_name" \
            --resource-group "$rg_name" \
            --location "$LOCATION" \
            --logs-workspace-id "$workspace_id" \
            --logs-workspace-key "$workspace_key" \
            --tags \
                Environment="$env" \
                Project="TrustMe" \
            --output table
        
        success "Container Apps Environment erstellt: $env_name"
    done
}

# Service Principal für GitHub Actions erstellen
create_service_principal() {
    log "Erstelle Service Principal für GitHub Actions..."
    
    local sp_name="trustme-github-actions"
    
    # Service Principal erstellen
    local sp_output=$(az ad sp create-for-rbac \
        --name "$sp_name" \
        --role contributor \
        --scopes "/subscriptions/$SUBSCRIPTION_ID" \
        --sdk-auth)
    
    # Credentials speichern
    echo "$sp_output" > ".azure-github-credentials.json"
    
    success "Service Principal erstellt: $sp_name"
    warning "GitHub Credentials gespeichert in: .azure-github-credentials.json"
    
    echo ""
    warning "WICHTIG: Füge folgende Secrets zu deinem GitHub Repository hinzu:"
    echo "1. AZURE_CREDENTIALS: $(cat .azure-github-credentials.json)"
    echo "2. DB_ADMIN_PASSWORD: (aus .azure-db-*.txt Dateien)"
    echo "3. JWT_SECRET_KEY: $(openssl rand -base64 32)"
}

# Zusammenfassung anzeigen
show_summary() {
    echo ""
    success "=== AZURE SETUP ABGESCHLOSSEN ==="
    echo ""
    echo "Erstellte Ressourcen:"
    
    for env in "${ENVIRONMENTS[@]}"; do
        echo ""
        echo "Environment: $env"
        echo "  - Resource Group: ${APP_NAME}-${env}-rg"
        echo "  - Container Registry: $(cat .azure-registry-${env}.txt 2>/dev/null || echo 'N/A')"
        echo "  - Key Vault: $(cat .azure-keyvault-${env}.txt 2>/dev/null || echo 'N/A')"
        echo "  - PostgreSQL: ${APP_NAME}-${env}-db"
        echo "  - Container Apps Env: ${APP_NAME}-${env}-env"
        echo "  - Log Analytics: ${APP_NAME}-${env}-logs"
    done
    
    echo ""
    warning "Nächste Schritte:"
    echo "1. GitHub Secrets konfigurieren (siehe oben)"
    echo "2. DNS-Einträge für Custom Domain konfigurieren (optional)"
    echo "3. SSL-Zertifikate für Production einrichten"
    echo "4. Deployment mit: ./deploy-azure.sh"
    echo ""
}

# Cleanup bei Fehler
cleanup_on_error() {
    if [ "$1" == "--cleanup" ]; then
        warning "Lösche alle erstellten Ressourcen..."
        read -p "Bist du sicher? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            for env in "${ENVIRONMENTS[@]}"; do
                local rg_name="${APP_NAME}-${env}-rg"
                az group delete --name "$rg_name" --yes --no-wait
            done
            success "Cleanup gestartet"
        fi
        exit 0
    fi
}

# Main Funktion
main() {
    echo -e "${BLUE}"
    echo "========================================="
    echo "  TrustMe Azure Resources Setup"
    echo "========================================="
    echo -e "${NC}"
    
    cleanup_on_error "$1"
    
    check_azure_cli
    azure_login
    create_resource_groups
    create_container_registries
    create_key_vaults
    create_log_analytics
    create_postgresql_servers
    create_container_app_environments
    create_service_principal
    show_summary
    
    success "Setup abgeschlossen! 🚀"
}

# Script ausführen
main "$@"
