param name string
param location string = resourceGroup().location
param tags object = {}
param principalId string = ''

resource keyVault 'Microsoft.KeyVault/vaults@2022-07-01' = {
  name: name
  location: location
  tags: tags
  properties: {
    tenantId: subscription().tenantId
    sku: {
      family: 'A'
      name: 'standard'
    }
    accessPolicies: !empty(principalId) ? [
      {
        objectId: principalId
        permissions: {
          secrets: [
            'get'
            'list'
            'set'
            'delete'
          ]
        }
        tenantId: subscription().tenantId
      }
    ] : []
    enabledForDeployment: false
    enabledForDiskEncryption: false
    enabledForTemplateDeployment: false
    enableSoftDelete: true
    softDeleteRetentionInDays: 90
    enableRbacAuthorization: false
  }
}

// Generate database password
resource databasePasswordSecret 'Microsoft.KeyVault/vaults/secrets@2022-07-01' = {
  parent: keyVault
  name: 'database-password'
  properties: {
    value: uniqueString(resourceGroup().id, name, 'database')
  }
}

// Generate JWT secret
resource jwtSecretSecret 'Microsoft.KeyVault/vaults/secrets@2022-07-01' = {
  parent: keyVault
  name: 'jwt-secret'
  properties: {
    value: base64(uniqueString(resourceGroup().id, name, 'jwt'))
  }
}

output name string = keyVault.name
output uri string = keyVault.properties.vaultUri