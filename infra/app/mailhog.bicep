param name string
param location string = resourceGroup().location
param tags object = {}
param containerAppsEnvironmentName string
param exists bool = false

resource containerAppsEnvironment 'Microsoft.App/managedEnvironments@2023-05-01' existing = {
  name: containerAppsEnvironmentName
}

resource mailhogApp 'Microsoft.App/containerApps@2023-05-01' = {
  name: name
  location: location
  tags: union(tags, { 'azd-service-name': 'mailhog' })
  properties: {
    managedEnvironmentId: containerAppsEnvironment.id
    configuration: {
      ingress: {
        external: true
        targetPort: 8025
        transport: 'http'
        allowInsecure: false
      }
    }
    template: {
      containers: [
        {
          image: 'mailhog/mailhog:latest'
          name: 'trustme-mailhog'
          resources: {
            cpu: json('0.25')
            memory: '0.5Gi'
          }
          env: []
        }
      ]
      scale: {
        minReplicas: 1
        maxReplicas: 1
      }
    }
  }
}

output uri string = 'https://${mailhogApp.properties.configuration.ingress.fqdn}'