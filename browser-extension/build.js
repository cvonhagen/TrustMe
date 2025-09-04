#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Build configuration
const BUILD_DIR = 'dist';
const SOURCE_FILES = [
    'manifest.json',
    'popup.html',
    'popup.js',
    'src/',
    'api/',
    'utils/',
    'public/'
];

// Ensure all required icon files exist
const REQUIRED_ICONS = [
    'public/icon16.png',
    'public/icon48.png', 
    'public/icon128.png',
    'public/layer8.png'
];

// Clean build directory
function cleanBuildDir() {
    if (fs.existsSync(BUILD_DIR)) {
        fs.rmSync(BUILD_DIR, { recursive: true, force: true });
    }
    fs.mkdirSync(BUILD_DIR, { recursive: true });
}

// Copy files recursively
function copyRecursive(src, dest) {
    const stat = fs.statSync(src);
    
    if (stat.isDirectory()) {
        if (!fs.existsSync(dest)) {
            fs.mkdirSync(dest, { recursive: true });
        }
        
        const files = fs.readdirSync(src);
        files.forEach(file => {
            copyRecursive(path.join(src, file), path.join(dest, file));
        });
    } else {
        fs.copyFileSync(src, dest);
    }
}

// Build extension
function build() {
    console.log('🔨 Building TrustMe Browser Extension...');
    
    // Clean build directory
    cleanBuildDir();
    
    // Check for required icons
    console.log('🔍 Checking required icons...');
    REQUIRED_ICONS.forEach(iconPath => {
        const fullPath = path.join(__dirname, iconPath);
        if (!fs.existsSync(fullPath)) {
            console.warn(`⚠️  Warning: Required icon ${iconPath} not found at ${fullPath}!`);
        } else {
            console.log(`✅ Found ${iconPath}`);
        }
    });
    
    // Copy source files
    SOURCE_FILES.forEach(file => {
        const srcPath = path.join(__dirname, file);
        const destPath = path.join(__dirname, BUILD_DIR, file);
        
        if (fs.existsSync(srcPath)) {
            console.log(`📁 Copying ${file}...`);
            copyRecursive(srcPath, destPath);
        } else {
            console.warn(`⚠️  Warning: ${file} not found, skipping...`);
        }
    });
    
    // Copy README
    if (fs.existsSync('README.md')) {
        fs.copyFileSync('README.md', path.join(BUILD_DIR, 'README.md'));
    }
    
    console.log('✅ Build completed successfully!');
    console.log(`📦 Extension built in: ${BUILD_DIR}/`);
    console.log('');
    console.log('To load in Chrome:');
    console.log('1. Open chrome://extensions/');
    console.log('2. Enable Developer mode');
    console.log('3. Click "Load unpacked"');
    console.log(`4. Select the ${BUILD_DIR}/ folder`);
}

// Main execution
if (require.main === module) {
    const args = process.argv.slice(2);
    const isDev = args.includes('--dev');
    const isProd = args.includes('--prod');
    const isWatch = args.includes('--watch');
    
    if (isDev) {
        console.log('🔧 Development build');
    } else if (isProd) {
        console.log('🚀 Production build');
    }
    
    build();
    
    if (isWatch) {
        console.log('👀 Watching for changes...');
        // Simple file watcher (in production, you might want to use chokidar)
        SOURCE_FILES.forEach(file => {
            if (fs.existsSync(file)) {
                fs.watch(file, { recursive: true }, (eventType, filename) => {
                    console.log(`📝 File changed: ${filename}`);
                    build();
                });
            }
        });
    }
}

module.exports = { build };