param name string
param location string = resourceGroup().location
param tags object = {}
param databaseName string
param keyVaultName string

// Get database password from Key Vault
resource keyVault 'Microsoft.KeyVault/vaults@2022-07-01' existing = {
  name: keyVaultName
}

resource databasePasswordSecret 'Microsoft.KeyVault/vaults/secrets@2022-07-01' existing = {
  parent: keyVault
  name: 'database-password'
}

// PostgreSQL Flexible Server
resource postgresServer 'Microsoft.DBforPostgreSQL/flexibleServers@2023-06-01-preview' = {
  name: name
  location: location
  tags: tags
  sku: {
    name: 'Standard_B1ms'
    tier: 'Burstable'
  }
  properties: {
    administratorLogin: 'trustmeadmin'
    administratorLoginPassword: databasePasswordSecret.properties.value
    storage: {
      storageSizeGB: 32
    }
    version: '15'
    backup: {
      backupRetentionDays: 7
      geoRedundantBackup: 'Disabled'
    }
    highAvailability: {
      mode: 'Disabled'
    }
    maintenanceWindow: {
      customWindow: 'Disabled'
    }
  }
}

// Database
resource database 'Microsoft.DBforPostgreSQL/flexibleServers/databases@2023-06-01-preview' = {
  parent: postgresServer
  name: databaseName
  properties: {
    charset: 'utf8'
    collation: 'en_US.utf8'
  }
}

// Firewall rule for Azure services
resource firewallRule 'Microsoft.DBforPostgreSQL/flexibleServers/firewallRules@2023-06-01-preview' = {
  parent: postgresServer
  name: 'AllowAzureServices'
  properties: {
    startIpAddress: '0.0.0.0'
    endIpAddress: '0.0.0.0'
  }
}

output host string = postgresServer.properties.fullyQualifiedDomainName
output databaseName string = database.name
output username string = postgresServer.properties.administratorLogin