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
}

var abbrs = loadJsonContent('./abbreviations.json')
var resourceToken = toLower(uniqueString(resourceGroup().id, environmentName, location))

module containerApps 'core/host/container-apps.bicep' = {
  name: 'container-apps'
  params: {
    name: 'app'
    location: location
    tags: tags
    containerAppsEnvironmentName: '${abbrs.appManagedEnvironments}${resourceToken}'
    containerRegistryName: '${abbrs.containerRegistryRegistries}${resourceToken}'
    logAnalyticsWorkspaceName: '${abbrs.operationalInsightsWorkspaces}${resourceToken}'
  }
}

module backend 'app/backend.bicep' = {
  name: 'backend'
  params: {
    name: '${abbrs.appContainerApps}backend-${resourceToken}'
    location: location
    tags: tags
    identityName: '${abbrs.managedIdentityUserAssignedIdentities}backend-${resourceToken}'
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
    name: '${abbrs.appContainerApps}frontend-${resourceToken}'
    location: location
    tags: tags
    identityName: '${abbrs.managedIdentityUserAssignedIdentities}frontend-${resourceToken}'
    containerAppsEnvironmentName: containerApps.outputs.environmentName
    containerRegistryName: containerApps.outputs.registryName
    exists: false
    backendUrl: backend.outputs.uri
  }
}

module database 'core/database/postgresql.bicep' = {
  name: 'database'
  params: {
    name: '${abbrs.dBforPostgreSQLServers}${resourceToken}'
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
    name: '${abbrs.keyVaultVaults}${resourceToken}'
    location: location
    tags: tags
    principalId: principalId
  }
}

// Database outputs
output AZURE_DATABASE_HOST string = database.outputs.host
output AZURE_DATABASE_NAME string = database.outputs.databaseName
output AZURE_DATABASE_USERNAME string = database.outputs.username

// Container Apps outputs
output BACKEND_URI string = backend.outputs.uri
output FRONTEND_URI string = frontend.outputs.uri

// Key Vault output
output AZURE_KEY_VAULT_NAME string = keyVault.outputs.name