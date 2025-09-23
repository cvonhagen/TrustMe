targetScope = 'resourceGroup'

@minLength(1)
@maxLength(64)
@description('Name of the environment that can be used as part of naming resource convention')
param environmentName string

@minLength(1)
@description('Primary location for all resources')
param location string = resourceGroup().location

@description('Id of the user or app to assign application roles')
param principalId string = ''

// Tags that should be applied to all resources.
var tags = {
  'azd-env-name': environmentName
  'project': 'TrustMe Password Manager'
  'version': '1.0.0'
  'created-by': 'azd'
}

var abbrs = loadJsonContent('./abbreviations.json')
var resourceToken = toLower(uniqueString(resourceGroup().id, environmentName, location))
var shortToken = substring(resourceToken, 0, 6) // Nur 6 Zeichen statt dem ganzen Hash

module containerApps 'core/host/container-apps.bicep' = {
  name: 'container-apps'
  params: {
    name: 'app'
    location: location
    tags: tags
    containerAppsEnvironmentName: 'trustme-env-${shortToken}'
    containerRegistryName: 'trustmeregistry${shortToken}'
    logAnalyticsWorkspaceName: 'trustme-logs-${shortToken}'
  }
}

module backend 'app/backend.bicep' = {
  name: 'backend'
  params: {
    name: 'trustme-backend-${shortToken}'
    location: location
    tags: tags
    identityName: 'trustme-backend-identity-${shortToken}'
    containerAppsEnvironmentName: containerApps.outputs.environmentName
    containerRegistryName: containerApps.outputs.registryName
    exists: false
    databaseName: database.outputs.databaseName
    databaseHost: database.outputs.host
    databaseUser: database.outputs.username
    keyVaultName: keyVault.outputs.name
  }
  dependsOn: [
    database
    keyVault
  ]
}

module frontend 'app/frontend.bicep' = {
  name: 'frontend'
  params: {
    name: 'trustme-frontend-${shortToken}'
    location: location
    tags: tags
    identityName: 'trustme-frontend-identity-${shortToken}'
    containerAppsEnvironmentName: containerApps.outputs.environmentName
    containerRegistryName: containerApps.outputs.registryName
    exists: false
    backendUrl: backend.outputs.uri
  }
}

module mailhog 'app/mailhog.bicep' = {
  name: 'mailhog'
  params: {
    name: 'trustme-mailhog-${shortToken}'
    location: location
    tags: tags
    containerAppsEnvironmentName: containerApps.outputs.environmentName
    exists: false
  }
}

module database 'core/database/postgresql.bicep' = {
  name: 'database'
  params: {
    name: 'trustme-db-${shortToken}'
    location: location
    tags: tags
    databaseName: 'trustme'
    keyVaultName: keyVault.outputs.name
  }
  dependsOn: [
    keyVault
  ]
}

module keyVault 'core/security/keyvault.bicep' = {
  name: 'keyvault'
  params: {
    name: 'trustme-vault-${shortToken}'
    location: location
    tags: tags
    principalId: principalId
  }
}

module frontDoor 'core/security/frontdoor.bicep' = {
  name: 'frontdoor'
  params: {
    name: 'trustme-fd-${shortToken}'
    location: 'Global'
    tags: tags
    frontendOriginUrl: frontend.outputs.uri
    backendOriginUrl: backend.outputs.uri
    mailhogOriginUrl: mailhog.outputs.uri
    customDomainName: 'trustme-${shortToken}'
  }
  dependsOn: [
    frontend
    backend
    mailhog
  ]
}

// Database outputs
output AZURE_DATABASE_HOST string = database.outputs.host
output AZURE_DATABASE_NAME string = database.outputs.databaseName
output AZURE_DATABASE_USERNAME string = database.outputs.username

// Container Apps outputs (direkte URLs)
output BACKEND_URI string = backend.outputs.uri
output FRONTEND_URI string = frontend.outputs.uri
output MAILHOG_URI string = mailhog.outputs.uri

// Front Door outputs (schöne URLs mit WAF)
output TRUSTME_APP_URL string = frontDoor.outputs.frontendUrl
output TRUSTME_API_URL string = frontDoor.outputs.backendUrl
output TRUSTME_MAIL_URL string = frontDoor.outputs.mailhogUrl

// Key Vault output
output AZURE_KEY_VAULT_NAME string = keyVault.outputs.name