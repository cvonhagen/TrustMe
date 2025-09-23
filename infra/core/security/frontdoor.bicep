param name string
param location string = 'Global' // Front Door ist ein globaler Service
param tags object = {}
param frontendOriginUrl string
param backendOriginUrl string
param mailhogOriginUrl string
param customDomainName string = 'trustme'

// WAF Policy für Sicherheit
resource wafPolicy 'Microsoft.Network/FrontDoorWebApplicationFirewallPolicies@2022-05-01' = {
  name: '${name}waf'
  location: location
  tags: tags
  properties: {
    policySettings: {
      enabledState: 'Enabled'
      mode: 'Prevention'
      redirectUrl: null
      customBlockResponseStatusCode: 403
      customBlockResponseBody: null
    }
    managedRules: {
      managedRuleSets: [
        {
          ruleSetType: 'Microsoft_DefaultRuleSet'
          ruleSetVersion: '2.1'
          ruleGroupOverrides: []
        }
        {
          ruleSetType: 'Microsoft_BotManagerRuleSet'
          ruleSetVersion: '1.0'
          ruleGroupOverrides: []
        }
      ]
    }
    customRules: {
      rules: [
        {
          name: 'RateLimitRule'
          priority: 1
          enabledState: 'Enabled'
          ruleType: 'RateLimitRule'
          rateLimitDurationInMinutes: 1
          rateLimitThreshold: 100
          matchConditions: [
            {
              matchVariable: 'RemoteAddr'
              operator: 'IPMatch'
              negateCondition: false
              matchValue: [
                '0.0.0.0/0'
              ]
            }
          ]
          action: 'Block'
        }
      ]
    }
  }
}

// Front Door Profile
resource frontDoorProfile 'Microsoft.Cdn/profiles@2023-05-01' = {
  name: name
  location: location
  tags: tags
  sku: {
    name: 'Standard_AzureFrontDoor'
  }
  properties: {
    originResponseTimeoutSeconds: 60
  }
}

// Origin Groups
resource frontendOriginGroup 'Microsoft.Cdn/profiles/originGroups@2023-05-01' = {
  parent: frontDoorProfile
  name: 'trustme-frontend-og'
  properties: {
    loadBalancingSettings: {
      sampleSize: 4
      successfulSamplesRequired: 3
      additionalLatencyInMilliseconds: 50
    }
    healthProbeSettings: {
      probePath: '/'
      probeRequestType: 'HEAD'
      probeProtocol: 'Https'
      probeIntervalInSeconds: 100
    }
  }
}

resource backendOriginGroup 'Microsoft.Cdn/profiles/originGroups@2023-05-01' = {
  parent: frontDoorProfile
  name: 'trustme-backend-og'
  properties: {
    loadBalancingSettings: {
      sampleSize: 4
      successfulSamplesRequired: 3
      additionalLatencyInMilliseconds: 50
    }
    healthProbeSettings: {
      probePath: '/health'
      probeRequestType: 'GET'
      probeProtocol: 'Https'
      probeIntervalInSeconds: 100
    }
  }
}

resource mailhogOriginGroup 'Microsoft.Cdn/profiles/originGroups@2023-05-01' = {
  parent: frontDoorProfile
  name: 'trustme-mailhog-og'
  properties: {
    loadBalancingSettings: {
      sampleSize: 4
      successfulSamplesRequired: 3
      additionalLatencyInMilliseconds: 50
    }
    healthProbeSettings: {
      probePath: '/'
      probeRequestType: 'HEAD'
      probeProtocol: 'Https'
      probeIntervalInSeconds: 100
    }
  }
}

// Origins
resource frontendOriginResource 'Microsoft.Cdn/profiles/originGroups/origins@2023-05-01' = {
  parent: frontendOriginGroup
  name: 'trustme-frontend-origin'
  properties: {
    hostName: replace(replace(frontendOriginUrl, 'https://', ''), 'http://', '')
    httpPort: 80
    httpsPort: 443
    originHostHeader: replace(replace(frontendOriginUrl, 'https://', ''), 'http://', '')
    priority: 1
    weight: 1000
    enabledState: 'Enabled'
  }
}

resource backendOriginResource 'Microsoft.Cdn/profiles/originGroups/origins@2023-05-01' = {
  parent: backendOriginGroup
  name: 'trustme-backend-origin'
  properties: {
    hostName: replace(replace(backendOriginUrl, 'https://', ''), 'http://', '')
    httpPort: 80
    httpsPort: 443
    originHostHeader: replace(replace(backendOriginUrl, 'https://', ''), 'http://', '')
    priority: 1
    weight: 1000
    enabledState: 'Enabled'
  }
}

resource mailhogOriginResource 'Microsoft.Cdn/profiles/originGroups/origins@2023-05-01' = {
  parent: mailhogOriginGroup
  name: 'trustme-mailhog-origin'
  properties: {
    hostName: replace(replace(mailhogOriginUrl, 'https://', ''), 'http://', '')
    httpPort: 80
    httpsPort: 443
    originHostHeader: replace(replace(mailhogOriginUrl, 'https://', ''), 'http://', '')
    priority: 1
    weight: 1000
    enabledState: 'Enabled'
  }
}

// Endpoints mit schönen Namen
resource frontDoorEndpoint 'Microsoft.Cdn/profiles/afdEndpoints@2023-05-01' = {
  parent: frontDoorProfile
  name: '${customDomainName}-app'
  location: location
  properties: {
    enabledState: 'Enabled'
  }
}

resource backendEndpoint 'Microsoft.Cdn/profiles/afdEndpoints@2023-05-01' = {
  parent: frontDoorProfile
  name: '${customDomainName}-api'
  location: location
  properties: {
    enabledState: 'Enabled'
  }
}

resource mailhogEndpoint 'Microsoft.Cdn/profiles/afdEndpoints@2023-05-01' = {
  parent: frontDoorProfile
  name: '${customDomainName}-mail'
  location: location
  properties: {
    enabledState: 'Enabled'
  }
}

// Routes
resource frontendRoute 'Microsoft.Cdn/profiles/afdEndpoints/routes@2023-05-01' = {
  parent: frontDoorEndpoint
  name: 'frontend-route'
  properties: {
    originGroup: {
      id: frontendOriginGroup.id
    }
    supportedProtocols: [
      'Http'
      'Https'
    ]
    patternsToMatch: [
      '/*'
    ]
    linkToDefaultDomain: 'Enabled'
    httpsRedirect: 'Enabled'
    enabledState: 'Enabled'
  }
}

resource backendRoute 'Microsoft.Cdn/profiles/afdEndpoints/routes@2023-05-01' = {
  parent: backendEndpoint
  name: 'backend-route'
  properties: {
    originGroup: {
      id: backendOriginGroup.id
    }
    supportedProtocols: [
      'Http'
      'Https'
    ]
    patternsToMatch: [
      '/*'
    ]
    linkToDefaultDomain: 'Enabled'
    httpsRedirect: 'Enabled'
    enabledState: 'Enabled'
  }
}

resource mailhogRoute 'Microsoft.Cdn/profiles/afdEndpoints/routes@2023-05-01' = {
  parent: mailhogEndpoint
  name: 'mailhog-route'
  properties: {
    originGroup: {
      id: mailhogOriginGroup.id
    }
    supportedProtocols: [
      'Http'
      'Https'
    ]
    patternsToMatch: [
      '/*'
    ]
    linkToDefaultDomain: 'Enabled'
    httpsRedirect: 'Enabled'
    enabledState: 'Enabled'
  }
}

// Security Policy - WAF mit Front Door verknüpfen
resource securityPolicy 'Microsoft.Cdn/profiles/securityPolicies@2023-05-01' = {
  parent: frontDoorProfile
  name: 'trustme-security-policy'
  properties: {
    parameters: {
      type: 'WebApplicationFirewall'
      wafPolicy: {
        id: wafPolicy.id
      }
      associations: [
        {
          domains: [
            {
              id: frontDoorEndpoint.id
            }
            {
              id: backendEndpoint.id
            }
          ]
          patternsToMatch: [
            '/*'
          ]
        }
      ]
    }
  }
}

// Outputs - Schöne URLs
output frontendUrl string = 'https://${frontDoorEndpoint.properties.hostName}'
output backendUrl string = 'https://${backendEndpoint.properties.hostName}'
output mailhogUrl string = 'https://${mailhogEndpoint.properties.hostName}'
output frontDoorId string = frontDoorProfile.id
output wafPolicyId string = wafPolicy.id