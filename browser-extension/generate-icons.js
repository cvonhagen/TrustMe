const fs = require('fs');
const path = require('path');

// Simple PNG generation using Canvas API simulation
// This creates base64 encoded PNG data for the icons

function generateIconPNG(size) {
    // Create a simple PNG data structure
    // This is a simplified approach - in production you'd use a proper image library
    
    const canvas = `
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="${size}" height="${size}" rx="${size * 0.125}" ry="${size * 0.125}" fill="url(#grad1)"/>
      <text x="${size/2}" y="${size * 0.66}" font-family="Arial, sans-serif" font-size="${size * 0.5}" font-weight="bold" text-anchor="middle" fill="white">T</text>
    </svg>`;
    
    return canvas;
}

// Generate icons
const sizes = [16, 48, 128];
const publicDir = path.join(__dirname, 'public');

// Ensure public directory exists
if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
}

sizes.forEach(size => {
    const svgContent = generateIconPNG(size);
    const filename = `icon${size}.svg`;
    const filepath = path.join(publicDir, filename);
    
    fs.writeFileSync(filepath, svgContent);
    console.log(`Generated ${filename}`);
});

// Also create a favicon.ico equivalent
const faviconSVG = generateIconPNG(32);
fs.writeFileSync(path.join(publicDir, 'favicon.svg'), faviconSVG);

console.log('All icons generated successfully!');
console.log('Note: For production, convert SVG files to PNG using an image converter.');
console.log('You can use online tools like https://convertio.co/svg-png/ or install sharp/jimp for Node.js conversion.');

// Create a simple HTML file to convert SVGs to PNGs
const converterHTML = `
<!DOCTYPE html>
<html>
<head>
    <title>SVG to PNG Converter</title>
    <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        .converter { margin: 20px 0; padding: 20px; border: 1px solid #ddd; border-radius: 8px; }
        canvas { border: 1px solid #ccc; margin: 10px; }
        button { padding: 10px 20px; background: #667eea; color: white; border: none; border-radius: 4px; cursor: pointer; }
        button:hover { background: #5a6fd8; }
    </style>
</head>
<body>
    <h1>TrustMe Extension Icon Converter</h1>
    <p>This tool converts the SVG icons to PNG format for the browser extension.</p>
    
    ${sizes.map(size => `
    <div class="converter">
        <h3>Icon ${size}x${size}</h3>
        <div id="svg${size}"></div>
        <canvas id="canvas${size}" width="${size}" height="${size}"></canvas>
        <br>
        <button onclick="convertToPNG(${size})">Convert to PNG</button>
        <a id="download${size}" style="display:none; margin-left: 10px;">Download PNG</a>
    </div>
    `).join('')}
    
    <script>
        // Load SVG content
        ${sizes.map(size => `
        document.getElementById('svg${size}').innerHTML = \`${generateIconPNG(size)}\`;
        `).join('')}
        
        function convertToPNG(size) {
            const canvas = document.getElementById('canvas' + size);
            const ctx = canvas.getContext('2d');
            const svg = document.querySelector('#svg' + size + ' svg');
            
            // Create image from SVG
            const svgData = new XMLSerializer().serializeToString(svg);
            const svgBlob = new Blob([svgData], {type: 'image/svg+xml;charset=utf-8'});
            const svgUrl = URL.createObjectURL(svgBlob);
            
            const img = new Image();
            img.onload = function() {
                ctx.clearRect(0, 0, size, size);
                ctx.drawImage(img, 0, 0, size, size);
                
                // Create download link
                canvas.toBlob(function(blob) {
                    const url = URL.createObjectURL(blob);
                    const download = document.getElementById('download' + size);
                    download.href = url;
                    download.download = 'icon' + size + '.png';
                    download.textContent = 'Download icon' + size + '.png';
                    download.style.display = 'inline';
                });
                
                URL.revokeObjectURL(svgUrl);
            };
            img.src = svgUrl;
        }
    </script>
</body>
</html>`;

fs.writeFileSync(path.join(__dirname, 'icon-converter.html'), converterHTML);
console.log('Created icon-converter.html - open this file in a browser to generate PNG files.');