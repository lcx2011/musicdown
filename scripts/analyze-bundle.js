/**
 * Bundle Size Analysis Script
 * Analyzes the built application to ensure it meets size requirements
 */

const fs = require('fs');
const path = require('path');

const MAX_BUNDLE_SIZE_MB = 150;
const DIST_DIR = path.join(__dirname, '..', 'dist');
const DIST_ELECTRON_DIR = path.join(__dirname, '..', 'dist-electron');
const DIST_BUILDER_DIR = path.join(__dirname, '..', 'dist-builder');

function getDirectorySize(dirPath) {
  let totalSize = 0;
  
  if (!fs.existsSync(dirPath)) {
    return 0;
  }
  
  const files = fs.readdirSync(dirPath);
  
  for (const file of files) {
    const filePath = path.join(dirPath, file);
    const stats = fs.statSync(filePath);
    
    if (stats.isDirectory()) {
      totalSize += getDirectorySize(filePath);
    } else {
      totalSize += stats.size;
    }
  }
  
  return totalSize;
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function analyzeBundle() {
  console.log('='.repeat(60));
  console.log('Bundle Size Analysis');
  console.log('='.repeat(60));
  console.log();
  
  // Analyze dist directory
  const distSize = getDirectorySize(DIST_DIR);
  console.log(`Frontend Build (dist/):        ${formatBytes(distSize)}`);
  
  // Analyze dist-electron directory
  const distElectronSize = getDirectorySize(DIST_ELECTRON_DIR);
  console.log(`Electron Build (dist-electron/): ${formatBytes(distElectronSize)}`);
  
  // Analyze final executable
  const exePath = path.join(DIST_BUILDER_DIR, 'BilibiliDownloader-Portable.exe');
  let exeSize = 0;
  
  if (fs.existsSync(exePath)) {
    const stats = fs.statSync(exePath);
    exeSize = stats.size;
    console.log(`Final Executable:               ${formatBytes(exeSize)}`);
  } else {
    console.log('Final Executable:               Not found (run build first)');
  }
  
  console.log();
  console.log('-'.repeat(60));
  
  const totalSizeMB = exeSize / (1024 * 1024);
  console.log(`Total Size:                     ${formatBytes(exeSize)} (${totalSizeMB.toFixed(2)} MB)`);
  console.log(`Target Size:                    < ${MAX_BUNDLE_SIZE_MB} MB`);
  
  if (exeSize > 0) {
    const percentOfTarget = (totalSizeMB / MAX_BUNDLE_SIZE_MB) * 100;
    console.log(`Percentage of Target:           ${percentOfTarget.toFixed(1)}%`);
    
    console.log();
    
    if (totalSizeMB <= MAX_BUNDLE_SIZE_MB) {
      console.log('✓ Bundle size is within target!');
    } else {
      console.log('✗ Bundle size exceeds target!');
      console.log(`  Need to reduce by: ${formatBytes(exeSize - (MAX_BUNDLE_SIZE_MB * 1024 * 1024))}`);
    }
  }
  
  console.log();
  console.log('='.repeat(60));
}

// Run analysis
try {
  analyzeBundle();
} catch (error) {
  console.error('Error analyzing bundle:', error.message);
  process.exit(1);
}
