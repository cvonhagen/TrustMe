// TrustMe Password Manager - Complete Azure Portal Deployment
// Kopiere diesen Code direkt in das Azure Portal Custom Deployment

@description('Name der Anwendung')
param appName string = 'trustme'

@description('Azure Region für Deployment')
param location string = resourceGroup().location

@description('Environment (dev, staging, prod)')
param environment string = 'prod'

@description('Database Administrator Username')
param dbAdminUsername string = 'trustmeadmin'

@description('Database Administrator Password')
@secure()
param dbAdminPassword string

@description('JWT Secret Key (mindestens 32 Zeichen)')
@secure()
param jwtSecretKey string

// Variables
var resourcePrefix = '${appName}-${environment}'
var containerAppEnvName = '${resourcePrefix}-env'
var backendAppName = '${resourcePrefix}-backend'
var frontendAppName = '${resourcePrefix}-frontend'
var dbServerName = '${resourcePrefix}-db'
var dbName = 'trustme'
var keyVaultName = '${resourcePrefix}-kv-${uniqueString(resourceGroup().id)}'
var containerRegistryName = '${appName}registry${uniqueString(resourceGroup().id)}'

// Container Registry
resource containerRegistry 'Microsoft.ContainerRegistry/registries@2023-01-01-preview' = {
  name: containerRegistryName
  location: location
  sku: {
    name: 'Basic'
  }
  properties: {
    adminUserEnabled: true
  }
}

// Key Vault für Secrets
resource keyVault 'Microsoft.KeyVault/vaults@2023-02-01' = {
  name: keyVaultName
  location: location
  properties: {
    sku: {
      family: 'A'
      name: 'standard'
    }
    tenantId: subscription().tenantId
    accessPolicies: []
    enableRbacAuthorization: true
  }
}

// PostgreSQL Flexible Server
resource dbServer 'Microsoft.DBforPostgreSQL/flexibleServers@2023-03-01-preview' = {
  name: dbServerName
  location: location
  sku: {
    name: 'Standard_B1ms'
    tier: 'Burstable'
  }
  properties: {
    administratorLogin: dbAdminUsername
    administratorLoginPassword: dbAdminPassword
    version: '15'
    storage: {
      storageSizeGB: 32
    }
    backup: {
      backupRetentionDays: 7
      geoRedundantBackup: 'Disabled'
    }
    highAvailability: {
      mode: 'Disabled'
    }
  }
}

// Database
resource database 'Microsoft.DBforPostgreSQL/flexibleServers/databases@2023-03-01-preview' = {
  parent: dbServer
  name: dbName
  properties: {
    charset: 'UTF8'
    collation: 'en_US.UTF8'
  }
}

// Firewall Rule für Azure Services
resource dbFirewallRule 'Microsoft.DBforPostgreSQL/flexibleServers/firewallRules@2023-03-01-preview' = {
  parent: dbServer
  name: 'AllowAzureServices'
  properties: {
    startIpAddress: '0.0.0.0'
    endIpAddress: '0.0.0.0'
  }
}

// Log Analytics Workspace
resource logAnalytics 'Microsoft.OperationalInsights/workspaces@2022-10-01' = {
  name: '${resourcePrefix}-logs'
  location: location
  properties: {
    sku: {
      name: 'PerGB2018'
    }
    retentionInDays: 30
  }
}

// Container Apps Environment
resource containerAppEnv 'Microsoft.App/managedEnvironments@2023-05-01' = {
  name: containerAppEnvName
  location: location
  properties: {
    appLogsConfiguration: {
      destination: 'log-analytics'
      logAnalyticsConfiguration: {
        customerId: logAnalytics.properties.customerId
        sharedKey: logAnalytics.listKeys().primarySharedKey
      }
    }
  }
}

// Backend Container App mit Placeholder Image
resource backendApp 'Microsoft.App/containerApps@2023-05-01' = {
  name: backendAppName
  location: location
  properties: {
    managedEnvironmentId: containerAppEnv.id
    configuration: {
      activeRevisionsMode: 'Single'
      ingress: {
        external: true
        targetPort: 3030
        allowInsecure: false
        traffic: [
          {
            weight: 100
            latestRevision: true
          }
        ]
      }
      registries: [
        {
          server: containerRegistry.properties.loginServer
          username: containerRegistry.name
          passwordSecretRef: 'registry-password'
        }
      ]
      secrets: [
        {
          name: 'registry-password'
          value: containerRegistry.listCredentials().passwords[0].value
        }
        {
          name: 'database-url'
          value: 'postgresql://${dbAdminUsername}:${dbAdminPassword}@${dbServer.properties.fullyQualifiedDomainName}:5432/${dbName}?sslmode=require'
        }
        {
          name: 'jwt-secret'
          value: jwtSecretKey
        }
      ]
    }
    template: {
      containers: [
        {
          name: 'backend'
          // Placeholder Image - wird später durch eigenes Image ersetzt
          image: 'mcr.microsoft.com/azuredocs/containerapps-helloworld:latest'
          resources: {
            cpu: json('0.5')
            memory: '1Gi'
          }
          env: [
            {
              name: 'PORT'
              value: '3030'
            }
            {
              name: 'DATABASE_URL'
              secretRef: 'database-url'
            }
            {
              name: 'JWT_SECRET_KEY'
              secretRef: 'jwt-secret'
            }
            {
              name: 'ALLOWED_ORIGINS'
              value: 'https://${frontendAppName}.${containerAppEnv.properties.defaultDomain}'
            }
          ]
        }
      ]
      scale: {
        minReplicas: 1
        maxReplicas: 5
        rules: [
          {
            name: 'http-scaling'
            http: {
              metadata: {
                concurrentRequests: '100'
              }
            }
          }
        ]
      }
    }
  }
}

// Frontend Container App mit Placeholder Image
resource frontendApp 'Microsoft.App/containerApps@2023-05-01' = {
  name: frontendAppName
  location: location
  properties: {
    managedEnvironmentId: containerAppEnv.id
    configuration: {
      activeRevisionsMode: 'Single'
      ingress: {
        external: true
        targetPort: 80
        allowInsecure: false
        traffic: [
          {
            weight: 100
            latestRevision: true
          }
        ]
      }
      registries: [
        {
          server: containerRegistry.properties.loginServer
          username: containerRegistry.name
          passwordSecretRef: 'registry-password'
        }
      ]
      secrets: [
        {
          name: 'registry-password'
          value: containerRegistry.listCredentials().passwords[0].value
        }
      ]
    }
    template: {
      containers: [
        {
          name: 'frontend'
          // Placeholder Image - wird später durch eigenes Image ersetzt
          image: 'mcr.microsoft.com/azuredocs/containerapps-helloworld:latest'
          resources: {
            cpu: json('0.25')
            memory: '0.5Gi'
          }
          env: [
            {
              name: 'VITE_BACKEND_URL'
              value: 'https://${backendApp.properties.configuration.ingress.fqdn}/api/v1'
            }
          ]
        }
      ]
      scale: {
        minReplicas: 1
        maxReplicas: 10
        rules: [
          {
            name: 'http-scaling'
            http: {
              metadata: {
                concurrentRequests: '50'
              }
            }
          }
        ]
      }
    }
  }
}

// Outputs für wichtige Informationen
output containerRegistryLoginServer string = containerRegistry.properties.loginServer
output containerRegistryName string = containerRegistry.name
output backendUrl string = 'https://${backendApp.properties.configuration.ingress.fqdn}'
output frontendUrl string = 'https://${frontendApp.properties.configuration.ingress.fqdn}'
output databaseConnectionString string = 'postgresql://${dbAdminUsername}:${dbAdminPassword}@${dbServer.properties.fullyQualifiedDomainName}:5432/${dbName}?sslmode=require'
output backendAppName string = backendAppName
output frontendAppName string = frontendAppName
output resourceGroupName string = resourceGroup().name

// Deployment Commands für später (als Kommentar)
/*
NACH DEM DEPLOYMENT - Container Images bauen und pushen:

1. Container Registry Login:
az acr login --name REGISTRY_NAME

2. Backend Image bauen und pushen:
docker build -t REGISTRY_SERVER/trustme/backend:latest ./backend
docker push REGISTRY_SERVER/trustme/backend:latest

3. Frontend Image bauen und pushen:
docker build -t REGISTRY_SERVER/trustme/frontend:latest ./frontend  
docker push REGISTRY_SERVER/trustme/frontend:latest

4. Container Apps aktualisieren:
az containerapp update --name BACKEND_APP_NAME --resource-group RESOURCE_GROUP --image REGISTRY_SERVER/trustme/backend:latest
az containerapp update --name FRONTEND_APP_NAME --resource-group RESOURCE_GROUP --image REGISTRY_SERVER/trustme/frontend:latest

Ersetze dabei:
- REGISTRY_NAME: Aus Output "containerRegistryName"
- REGISTRY_SERVER: Aus Output "containerRegistryLoginServer" 
- BACKEND_APP_NAME: Aus Output "backendAppName"
- FRONTEND_APP_NAME: Aus Output "frontendAppName"
- RESOURCE_GROUP: Aus Output "resourceGroupName"
*/
