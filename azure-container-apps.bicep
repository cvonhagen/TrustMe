@description('Name der Applikation')
param appName string = 'trustme'

@description('Azure Region')
param location string = resourceGroup().location

@description('Environment (dev, staging, prod)')
param environment string = 'prod'

@description('Container Registry Name')
param containerRegistryName string

@description('Database Admin Password')
@secure()
param dbAdminPassword string

@description('JWT Secret Key')
@secure()
param jwtSecretKey string

// Variables
var resourceNamePrefix = '${appName}-${environment}'
var containerRegistryLoginServer = '${containerRegistryName}.azurecr.io'

// Container Apps Environment
resource containerAppsEnvironment 'Microsoft.App/managedEnvironments@2023-05-01' = {
  name: '${resourceNamePrefix}-env'
  location: location
  properties: {
    appLogsConfiguration: {
      destination: 'log-analytics'
      logAnalyticsConfiguration: {
        customerId: logAnalyticsWorkspace.properties.customerId
        sharedKey: logAnalyticsWorkspace.listKeys().primarySharedKey
      }
    }
  }
}

// Log Analytics Workspace
resource logAnalyticsWorkspace 'Microsoft.OperationalInsights/workspaces@2023-09-01' = {
  name: '${resourceNamePrefix}-logs'
  location: location
  properties: {
    sku: {
      name: 'PerGB2018'
    }
    retentionInDays: 30
    features: {
      searchVersion: 1
      legacy: 0
      enableLogAccessUsingOnlyResourcePermissions: true
    }
  }
}

// Azure Database for PostgreSQL
resource postgresServer 'Microsoft.DBforPostgreSQL/flexibleServers@2023-06-01-preview' = {
  name: '${resourceNamePrefix}-db'
  location: location
  sku: {
    name: 'Standard_B1ms'
    tier: 'Burstable'
  }
  properties: {
    administratorLogin: 'trustmeadmin'
    administratorLoginPassword: dbAdminPassword
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
resource postgresDatabase 'Microsoft.DBforPostgreSQL/flexibleServers/databases@2023-06-01-preview' = {
  parent: postgresServer
  name: 'trustme'
  properties: {
    charset: 'utf8'
    collation: 'en_US.utf8'
  }
}

// Firewall rule for Azure services
resource postgresFirewallRule 'Microsoft.DBforPostgreSQL/flexibleServers/firewallRules@2023-06-01-preview' = {
  parent: postgresServer
  name: 'AllowAzureServices'
  properties: {
    startIpAddress: '0.0.0.0'
    endIpAddress: '0.0.0.0'
  }
}

// Backend Container App
resource backendContainerApp 'Microsoft.App/containerApps@2023-05-01' = {
  name: '${resourceNamePrefix}-backend'
  location: location
  properties: {
    managedEnvironmentId: containerAppsEnvironment.id
    configuration: {
      activeRevisionsMode: 'Single'
      ingress: {
        external: true
        targetPort: 8080
        corsPolicy: {
          allowedOrigins: ['*']
          allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
          allowedHeaders: ['*']
        }
      }
      registries: [
        {
          server: containerRegistryLoginServer
          username: containerRegistryName
          passwordSecretRef: 'registry-password'
        }
      ]
      secrets: [
        {
          name: 'registry-password'
          value: listCredentials(resourceId('Microsoft.ContainerRegistry/registries', containerRegistryName), '2023-07-01').passwords[0].value
        }
        {
          name: 'jwt-secret'
          value: jwtSecretKey
        }
        {
          name: 'db-password'
          value: dbAdminPassword
        }
      ]
    }
    template: {
      containers: [
        {
          image: '${containerRegistryLoginServer}/trustme/backend:latest'
          name: 'backend'
          env: [
            {
              name: 'PORT'
              value: '8080'
            }
            {
              name: 'DB_HOST'
              value: postgresServer.properties.fullyQualifiedDomainName
            }
            {
              name: 'DB_PORT'
              value: '5432'
            }
            {
              name: 'DB_NAME'
              value: 'trustme'
            }
            {
              name: 'DB_USER'
              value: 'trustmeadmin'
            }
            {
              name: 'DB_PASSWORD'
              secretRef: 'db-password'
            }
            {
              name: 'JWT_SECRET'
              secretRef: 'jwt-secret'
            }
            {
              name: 'ENVIRONMENT'
              value: environment
            }
          ]
          resources: {
            cpu: json('0.5')
            memory: '1Gi'
          }
        }
      ]
      scale: {
        minReplicas: 1
        maxReplicas: 3
      }
    }
  }
}

// Frontend Container App
resource frontendContainerApp 'Microsoft.App/containerApps@2023-05-01' = {
  name: '${resourceNamePrefix}-frontend'
  location: location
  properties: {
    managedEnvironmentId: containerAppsEnvironment.id
    configuration: {
      activeRevisionsMode: 'Single'
      ingress: {
        external: true
        targetPort: 80
      }
      registries: [
        {
          server: containerRegistryLoginServer
          username: containerRegistryName
          passwordSecretRef: 'registry-password'
        }
      ]
      secrets: [
        {
          name: 'registry-password'
          value: listCredentials(resourceId('Microsoft.ContainerRegistry/registries', containerRegistryName), '2023-07-01').passwords[0].value
        }
      ]
    }
    template: {
      containers: [
        {
          image: '${containerRegistryLoginServer}/trustme/frontend:latest'
          name: 'frontend'
          env: [
            {
              name: 'VITE_BACKEND_URL'
              value: 'https://${backendContainerApp.properties.configuration.ingress.fqdn}/api/v1'
            }
          ]
          resources: {
            cpu: json('0.25')
            memory: '0.5Gi'
          }
        }
      ]
      scale: {
        minReplicas: 1
        maxReplicas: 2
      }
    }
  }
}

// Outputs
output frontendUrl string = 'https://${frontendContainerApp.properties.configuration.ingress.fqdn}'
output backendUrl string = 'https://${backendContainerApp.properties.configuration.ingress.fqdn}'
output databaseServer string = postgresServer.properties.fullyQualifiedDomainName