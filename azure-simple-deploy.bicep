// TrustMe Password Manager - Azure Container Apps Deployment
// Vereinfachte Bicep-Datei für schnelles Deployment ohne Änderungen am Code

@description('Name der Anwendung')
param appName string = 'trustme'

@description('Azure Region')
param location string = resourceGroup().location

@description('Environment (dev, staging, prod)')
param environment string = 'prod'

@description('Container Registry Name')
param containerRegistryName string

@description('JWT Secret Key')
@secure()
param jwtSecretKey string

@description('Database Connection String (Neon.tech)')
@secure()
param databaseUrl string = 'postgresql://securme_owner:npg_2cUZlf8XzgPy@ep-mute-star-a23xllqn-pooler.eu-central-1.aws.neon.tech/securme?sslmode=require'

@description('SMTP Configuration')
param smtpHost string = 'smtp.gmail.com'
param smtpPort string = '587'
param fromEmail string = 'noreply@trustme.com'

@description('SMTP User und Password')
@secure()
param smtpUser string = ''
@secure()
param smtpPassword string = ''

// Container Apps Environment
resource containerAppsEnvironment 'Microsoft.App/managedEnvironments@2023-05-01' = {
  name: '${appName}-${environment}-env'
  location: location
  properties: {
    appLogsConfiguration: {
      destination: 'log-analytics'
    }
  }
}

// Backend Container App
resource backendApp 'Microsoft.App/containerApps@2023-05-01' = {
  name: '${appName}-${environment}-backend'
  location: location
  properties: {
    managedEnvironmentId: containerAppsEnvironment.id
    configuration: {
      ingress: {
        external: true
        targetPort: 8080
        transport: 'http'
        corsPolicy: {
          allowedOrigins: [
            'https://${appName}-${environment}-frontend.azurecontainerapps.io'
            'https://${appName}.azurestaticapps.net'
          ]
          allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
          allowedHeaders: ['*']
          allowCredentials: true
        }
      }
      registries: [
        {
          server: '${containerRegistryName}.azurecr.io'
        }
      ]
    }
    template: {
      containers: [
        {
          name: 'backend'
          image: '${containerRegistryName}.azurecr.io/trustme/backend:latest'
          resources: {
            cpu: json('0.5')
            memory: '1Gi'
          }
          env: [
            {
              name: 'PORT'
              value: '8080'
            }
            {
              name: 'NODE_ENV'
              value: 'production'
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
              value: 'https://${appName}-${environment}-frontend.azurecontainerapps.io,https://${appName}.azurestaticapps.net'
            }
            {
              name: 'SMTP_HOST'
              value: smtpHost
            }
            {
              name: 'SMTP_PORT'
              value: smtpPort
            }
            {
              name: 'FROM_EMAIL'
              value: fromEmail
            }
            {
              name: 'BASE_URL'
              value: 'https://${appName}-${environment}-frontend.azurecontainerapps.io'
            }
            {
              name: 'SMTP_USER'
              secretRef: 'smtp-user'
            }
            {
              name: 'SMTP_PASS'
              secretRef: 'smtp-password'
            }
          ]
          probes: [
            {
              type: 'Liveness'
              httpGet: {
                path: '/health'
                port: 8080
              }
              initialDelaySeconds: 30
              periodSeconds: 10
            }
            {
              type: 'Readiness'
              httpGet: {
                path: '/health'
                port: 8080
              }
              initialDelaySeconds: 5
              periodSeconds: 5
            }
          ]
        }
      ]
      scale: {
        minReplicas: 1
        maxReplicas: 3
      }
    }
    configuration: {
      secrets: [
        {
          name: 'database-url'
          value: databaseUrl
        }
        {
          name: 'jwt-secret'
          value: jwtSecretKey
        }
        {
          name: 'smtp-user'
          value: smtpUser
        }
        {
          name: 'smtp-password'
          value: smtpPassword
        }
      ]
    }
  }
}

// Frontend Container App
resource frontendApp 'Microsoft.App/containerApps@2023-05-01' = {
  name: '${appName}-${environment}-frontend'
  location: location
  properties: {
    managedEnvironmentId: containerAppsEnvironment.id
    configuration: {
      ingress: {
        external: true
        targetPort: 80
        transport: 'http'
      }
      registries: [
        {
          server: '${containerRegistryName}.azurecr.io'
        }
      ]
    }
    template: {
      containers: [
        {
          name: 'frontend'
          image: '${containerRegistryName}.azurecr.io/trustme/frontend:latest'
          resources: {
            cpu: json('0.25')
            memory: '0.5Gi'
          }
          env: [
            {
              name: 'VITE_BACKEND_URL'
              value: 'https://${backendApp.properties.configuration.ingress.fqdn}/api/v1'
            }
            {
              name: 'VITE_APP_NAME'
              value: 'TrustMe Password Manager'
            }
          ]
          probes: [
            {
              type: 'Liveness'
              httpGet: {
                path: '/'
                port: 80
              }
              initialDelaySeconds: 30
              periodSeconds: 10
            }
            {
              type: 'Readiness'
              httpGet: {
                path: '/'
                port: 80
              }
              initialDelaySeconds: 5
              periodSeconds: 5
            }
          ]
        }
      ]
      scale: {
        minReplicas: 1
        maxReplicas: 3
      }
    }
  }
}

// Outputs
output backendUrl string = 'https://${backendApp.properties.configuration.ingress.fqdn}'
output frontendUrl string = 'https://${frontendApp.properties.configuration.ingress.fqdn}'
output resourceGroupName string = resourceGroup().name