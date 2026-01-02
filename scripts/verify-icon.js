/**
 * Icon Verification Script
 * Verifies that the icon.ico file is valid and meets requirements
 */

const fs = require('fs');
const path = require('path');

function verifyIcon() {
  const iconPath = path.join(__dirname, '..', 'assets', 'icon.ico');
  
  console.log('Verifying application icon...\n');
  
  // Check if file exists
  if (!fs.existsSync(iconPath)) {
    console.error('✗ Icon file not found at:', iconPath);
    console.error('  Run: node scripts/create-simple-icon.js');
    return false;
  }
  console.log('✓ Icon file exists');
  
  // Read file
  const iconData = fs.readFileSync(iconPath);
  console.log('✓ Icon file is readable');
  console.log('  Size:', iconData.length, 'bytes');
  
  // Verify ICO header
  if (iconData.length < 6) {
    console.error('✗ Icon file is too small to be valid');
    return false;
  }
  
  const reserved = iconData.readUInt16LE(0);
  const type = iconData.readUInt16LE(2);
  const count = iconData.readUInt16LE(4);
  
  if (reserved !== 0) {
    console.error('✗ Invalid ICO header: reserved field should be 0');
    return false;
  }
  
  if (type !== 1) {
    console.error('✗ Invalid ICO header: type should be 1 (ICO format)');
    return false;
  }
  
  console.log('✓ Valid ICO header');
  console.log('  Type: ICO format');
  console.log('  Number of images:', count);
  
  // Read first image entry
  if (iconData.length < 22) {
    console.error('✗ Icon file is too small to contain image data');
    return false;
  }
  
  const width = iconData.readUInt8(6) || 256; // 0 means 256
  const height = iconData.readUInt8(7) || 256;
  const bpp = iconData.readUInt16LE(12);
  
  console.log('✓ Image information:');
  console.log('  Dimensions:', width + 'x' + height);
  console.log('  Bits per pixel:', bpp);
  
  // Verify minimum requirements for Windows 7
  if (width < 256 || height < 256) {
    console.warn('⚠ Warning: Icon should be at least 256x256 for best quality');
  }
  
  if (bpp < 32) {
    console.warn('⚠ Warning: Icon should be 32-bit for transparency support');
  }
  
  console.log('\n✓ Icon verification complete!');
  console.log('  The icon is ready for use in electron-builder');
  
  return true;
}

// Run verification
try {
  const isValid = verifyIcon();
  process.exit(isValid ? 0 : 1);
} catch (error) {
  console.error('Error verifying icon:', error);
  process.exit(1);
}
