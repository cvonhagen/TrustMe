import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Vite-Konfiguration für TrustMe Frontend
// Umfassende CommonJS-Unterstützung für React/Material-UI Ecosystem
export default defineConfig({
  plugins: [
    react()                     // React Hot-Reload Support
  ],
  // Dependency-Optimierung: Alle problematischen Module explizit behandeln
  optimizeDeps: {
    include: [                  // Alle CommonJS-Module explizit vorbundeln
      // React Ecosystem
      'react',
      'react-dom',
      'react-is',
      'prop-types',
      
      // Material-UI Ecosystem
      '@mui/material',
      '@mui/icons-material',
      '@emotion/react',
      '@emotion/styled',
      
      // HTTP & Cookie Libraries
      'axios',
      'cookie',
      'set-cookie-parser',
      
      // Crypto Libraries
      'crypto-js'
    ]
  },
  // Development-Server Konfiguration
  server: {
    host: '0.0.0.0',          // Container-externe Zugriffe erlauben
    port: 5173,               // Standard Vite-Port
    hmr: true                 // Hot Module Replacement aktivieren
  },
  // Build-Konfiguration für Production
  build: {
    sourcemap: true,          // Source-Maps für Debugging
    commonjsOptions: {
      include: [/.*/],          // Alle Module als CommonJS behandeln
      transformMixedEsModules: true
    }
  },
  // ESBuild-Konfiguration
  esbuild: {
    target: 'es2020'          // Moderne Browser-Kompatibilität
  }
})
