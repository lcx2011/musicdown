/**
 * Simple ICO file creator for Bilibili Downloader
 * Creates a basic 256x256 ICO file without external dependencies
 * 
 * This creates a simple icon with a blue background and white download arrow
 */

const fs = require('fs');
const path = require('path');

// Create a simple 32x32 BMP data for ICO format
// ICO format structure:
// - ICONDIR header (6 bytes)
// - ICONDIRENTRY for each image (16 bytes each)
// - Image data (BMP or PNG)

function createSimpleIcon() {
  const size = 256;
  const bpp = 32; // bits per pixel (RGBA)
  
  // Create RGBA pixel data
  const pixels = Buffer.alloc(size * size * 4);
  
  // Fill with a simple design
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;
      
      // Calculate distance from center for rounded corners
      const centerX = size / 2;
      const centerY = size / 2;
      const dx = x - centerX;
      const dy = y - centerY;
      const distFromCenter = Math.sqrt(dx * dx + dy * dy);
      const maxDist = size / 2 - 8;
      
      // Create rounded square
      const cornerRadius = 48;
      const left = 8, right = size - 8, top = 8, bottom = size - 8;
      
      let inShape = false;
      if (x >= left + cornerRadius && x <= right - cornerRadius && y >= top && y <= bottom) {
        inShape = true;
      } else if (y >= top + cornerRadius && y <= bottom - cornerRadius && x >= left && x <= right) {
        inShape = true;
      } else {
        // Check corners
        const corners = [
          { cx: left + cornerRadius, cy: top + cornerRadius },
          { cx: right - cornerRadius, cy: top + cornerRadius },
          { cx: left + cornerRadius, cy: bottom - cornerRadius },
          { cx: right - cornerRadius, cy: bottom - cornerRadius }
        ];
        
        for (const corner of corners) {
          const cdx = x - corner.cx;
          const cdy = y - corner.cy;
          if (cdx * cdx + cdy * cdy <= cornerRadius * cornerRadius) {
            inShape = true;
            break;
          }
        }
      }
      
      if (inShape) {
        // Bilibili blue gradient
        const gradientFactor = y / size;
        const r = Math.floor(0 + gradientFactor * 0);
        const g = Math.floor(161 - gradientFactor * 29);
        const b = Math.floor(214 - gradientFactor * 30);
        
        // Draw video frame (white rectangle)
        if (x >= 48 && x <= 208 && y >= 64 && y <= 160) {
          pixels[idx] = 255;     // R
          pixels[idx + 1] = 255; // G
          pixels[idx + 2] = 255; // B
          pixels[idx + 3] = 243; // A (slightly transparent)
          
          // Draw play triangle
          const playLeft = 108, playRight = 148, playTop = 88, playBottom = 136;
          const playMid = (playTop + playBottom) / 2;
          if (x >= playLeft && x <= playRight && y >= playTop && y <= playBottom) {
            // Triangle: point at right, base at left
            const relY = y - playTop;
            const triangleHeight = playBottom - playTop;
            const triangleWidth = playRight - playLeft;
            const leftEdge = playLeft + (Math.abs(relY - triangleHeight / 2) / (triangleHeight / 2)) * triangleWidth;
            
            if (x >= leftEdge) {
              pixels[idx] = 0;       // R
              pixels[idx + 1] = 161; // G
              pixels[idx + 2] = 214; // B
              pixels[idx + 3] = 255; // A
            }
          }
        }
        // Draw download arrow
        else if (
          // Arrow shaft
          (x >= 116 && x <= 140 && y >= 168 && y <= 216) ||
          // Arrow head
          (y >= 192 && y <= 224 && x >= 96 && x <= 160 && 
           (y - 192) >= Math.abs(x - 128) * 0.67)
        ) {
          pixels[idx] = 255;     // R
          pixels[idx + 1] = 255; // G
          pixels[idx + 2] = 255; // B
          pixels[idx + 3] = 255; // A
        } else {
          pixels[idx] = r;       // R
          pixels[idx + 1] = g;   // G
          pixels[idx + 2] = b;   // B
          pixels[idx + 3] = 255; // A
        }
      } else {
        // Transparent outside rounded square
        pixels[idx] = 0;
        pixels[idx + 1] = 0;
        pixels[idx + 2] = 0;
        pixels[idx + 3] = 0;
      }
    }
  }
  
  // Create PNG data (simpler than BMP for ICO)
  // For simplicity, we'll create a BMP instead
  return createBMPFromRGBA(pixels, size, size);
}

function createBMPFromRGBA(pixels, width, height) {
  const headerSize = 40;
  const fileHeaderSize = 14;
  const rowSize = Math.floor((width * 4 + 3) / 4) * 4; // Row must be multiple of 4 bytes
  const pixelDataSize = rowSize * height;
  const fileSize = fileHeaderSize + headerSize + pixelDataSize;
  
  const buffer = Buffer.alloc(fileSize);
  let offset = 0;
  
  // BMP File Header (14 bytes)
  buffer.write('BM', offset); offset += 2;
  buffer.writeUInt32LE(fileSize, offset); offset += 4;
  buffer.writeUInt32LE(0, offset); offset += 4; // Reserved
  buffer.writeUInt32LE(fileHeaderSize + headerSize, offset); offset += 4;
  
  // DIB Header (BITMAPINFOHEADER - 40 bytes)
  buffer.writeUInt32LE(headerSize, offset); offset += 4;
  buffer.writeInt32LE(width, offset); offset += 4;
  buffer.writeInt32LE(height, offset); offset += 4; // Positive = bottom-up
  buffer.writeUInt16LE(1, offset); offset += 2; // Planes
  buffer.writeUInt16LE(32, offset); offset += 2; // Bits per pixel
  buffer.writeUInt32LE(0, offset); offset += 4; // Compression (0 = none)
  buffer.writeUInt32LE(pixelDataSize, offset); offset += 4;
  buffer.writeInt32LE(2835, offset); offset += 4; // X pixels per meter
  buffer.writeInt32LE(2835, offset); offset += 4; // Y pixels per meter
  buffer.writeUInt32LE(0, offset); offset += 4; // Colors in palette
  buffer.writeUInt32LE(0, offset); offset += 4; // Important colors
  
  // Pixel data (bottom-up, BGRA format)
  for (let y = height - 1; y >= 0; y--) {
    for (let x = 0; x < width; x++) {
      const srcIdx = (y * width + x) * 4;
      buffer[offset++] = pixels[srcIdx + 2]; // B
      buffer[offset++] = pixels[srcIdx + 1]; // G
      buffer[offset++] = pixels[srcIdx];     // R
      buffer[offset++] = pixels[srcIdx + 3]; // A
    }
    // Padding to make row size multiple of 4
    const padding = rowSize - (width * 4);
    offset += padding;
  }
  
  return buffer;
}

function createICOFile(bmpData, width, height) {
  // ICO file structure:
  // ICONDIR (6 bytes) + ICONDIRENTRY (16 bytes) + BMP data
  
  const icoHeader = Buffer.alloc(6);
  icoHeader.writeUInt16LE(0, 0); // Reserved
  icoHeader.writeUInt16LE(1, 2); // Type (1 = ICO)
  icoHeader.writeUInt16LE(1, 4); // Number of images
  
  const icoDirEntry = Buffer.alloc(16);
  icoDirEntry.writeUInt8(width === 256 ? 0 : width, 0); // Width (0 = 256)
  icoDirEntry.writeUInt8(height === 256 ? 0 : height, 1); // Height (0 = 256)
  icoDirEntry.writeUInt8(0, 2); // Color palette
  icoDirEntry.writeUInt8(0, 3); // Reserved
  icoDirEntry.writeUInt16LE(1, 4); // Color planes
  icoDirEntry.writeUInt16LE(32, 6); // Bits per pixel
  icoDirEntry.writeUInt32LE(bmpData.length, 8); // Image data size
  icoDirEntry.writeUInt32LE(22, 12); // Offset to image data (6 + 16)
  
  return Buffer.concat([icoHeader, icoDirEntry, bmpData]);
}

// Main execution
try {
  console.log('Creating application icon...');
  
  const bmpData = createSimpleIcon();
  const icoData = createICOFile(bmpData, 256, 256);
  
  const assetsDir = path.join(__dirname, '..', 'assets');
  const icoPath = path.join(assetsDir, 'icon.ico');
  
  fs.writeFileSync(icoPath, icoData);
  
  console.log('✓ Icon created successfully at:', icoPath);
  console.log('  Size:', icoData.length, 'bytes');
  console.log('  Dimensions: 256x256 pixels');
  console.log('  Format: ICO with 32-bit RGBA');
  
} catch (error) {
  console.error('Error creating icon:', error);
  process.exit(1);
}
