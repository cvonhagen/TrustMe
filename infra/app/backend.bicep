param name string
param location string = resourceGroup().location
param tags object = {}
param identityName string
param containerAppsEnvironmentName string
param containerRegistryName string
param exists bool
param databaseName string
param databaseHost string
param databaseUser string
param keyVaultName string

// User-assigned managed identity
resource userIdentity 'Microsoft.ManagedIdentity/userAssignedIdentities@2023-01-31' = {
  name: identityName
  location: location
  tags: tags
}

// Get existing resources
resource containerAppsEnvironment 'Microsoft.App/managedEnvironments@2023-05-01' existing = {
  name: containerAppsEnvironmentName
}

resource containerRegistry 'Microsoft.ContainerRegistry/registries@2023-07-01' existing = {
  name: containerRegistryName
}

resource keyVault 'Microsoft.KeyVault/vaults@2022-07-01' existing = {
  name: keyVaultName
}

// Backend Container App
resource app 'Microsoft.App/containerApps@2023-05-01' = {
  name: name
  location: location
  tags: tags
  identity: {
    type: 'UserAssigned'
    userAssignedIdentities: {
      '${userIdentity.id}': {}
    }
  }
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
          server: containerRegistry.properties.loginServer
          identity: userIdentity.id
        }
      ]
      secrets: [
        {
          name: 'database-password'
          keyVaultUrl: '${keyVault.properties.vaultUri}secrets/database-password'
          identity: userIdentity.id
        }
        {
          name: 'jwt-secret'
          keyVaultUrl: '${keyVault.properties.vaultUri}secrets/jwt-secret'
          identity: userIdentity.id
        }
      ]
    }
    template: {
      containers: [
        {
          image: exists ? 'mcr.microsoft.com/azuredocs/containerapps-helloworld:latest' : '${containerRegistry.properties.loginServer}/trustme/backend:latest'
          name: 'backend'
          env: [
            {
              name: 'PORT'
              value: '8080'
            }
            {
              name: 'DB_HOST'
              value: databaseHost
            }
            {
              name: 'DB_PORT'
              value: '5432'
            }
            {
              name: 'DB_NAME'
              value: databaseName
            }
            {
              name: 'DB_USER'
              value: databaseUser
            }
            {
              name: 'DB_PASSWORD'
              secretRef: 'database-password'
            }
            {
              name: 'JWT_SECRET'
              secretRef: 'jwt-secret'
            }
            {
              name: 'ENVIRONMENT'
              value: 'production'
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

output name string = app.name
output uri string = 'https://${app.properties.configuration.ingress.fqdn}'
output identityPrincipalId string = userIdentity.properties.principalId