/**
 * Icon Generator for Bilibili Downloader
 * Generates a simple icon using node-canvas or sharp
 * 
 * This script creates a PNG icon that can be converted to ICO format
 */

const fs = require('fs');
const path = require('path');

// Simple SVG icon for Bilibili downloader
// Features: Download arrow + video play symbol
const iconSVG = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="256" height="256" viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg">
  <!-- Background gradient -->
  <defs>
    <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#00A1D6;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#0084B8;stop-opacity:1" />
    </linearGradient>
    <filter id="shadow">
      <feDropShadow dx="0" dy="2" stdDeviation="3" flood-opacity="0.3"/>
    </filter>
  </defs>
  
  <!-- Rounded rectangle background (Bilibili blue) -->
  <rect x="8" y="8" width="240" height="240" rx="48" fill="url(#bgGradient)"/>
  
  <!-- Video play symbol (rounded rectangle with play triangle) -->
  <g filter="url(#shadow)">
    <!-- Video frame -->
    <rect x="48" y="64" width="160" height="96" rx="12" fill="white" opacity="0.95"/>
    
    <!-- Play triangle -->
    <path d="M 108 88 L 108 136 L 148 112 Z" fill="#00A1D6"/>
  </g>
  
  <!-- Download arrow -->
  <g filter="url(#shadow)">
    <!-- Arrow shaft -->
    <rect x="116" y="168" width="24" height="48" rx="4" fill="white"/>
    
    <!-- Arrow head -->
    <path d="M 128 224 L 96 192 L 112 192 L 112 208 L 144 208 L 144 192 L 160 192 Z" fill="white"/>
  </g>
</svg>`;

// Save SVG file
const assetsDir = path.join(__dirname, '..', 'assets');
const svgPath = path.join(assetsDir, 'icon.svg');

try {
  fs.writeFileSync(svgPath, iconSVG, 'utf8');
  console.log('✓ SVG icon created at:', svgPath);
  console.log('\nNext steps:');
  console.log('1. Convert SVG to ICO format using one of these methods:');
  console.log('   - Online: https://convertio.co/svg-ico/');
  console.log('   - ImageMagick: convert icon.svg -define icon:auto-resize=256,128,64,48,32,16 icon.ico');
  console.log('   - Or use the provided PowerShell script');
  console.log('\n2. Save the ICO file as assets/icon.ico');
} catch (error) {
  console.error('Error creating SVG icon:', error);
  process.exit(1);
}
