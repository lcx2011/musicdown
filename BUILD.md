# Build Instructions

## Prerequisites

1. Node.js (v16 or higher)
2. pnpm (or npm/yarn)
3. Application icon file at `assets/icon.ico`

## Creating the Application Icon

Before building, you need to create an icon file:

1. Create or obtain a 256x256 pixel PNG image
2. Convert it to .ico format using one of these methods:

### Online Tools
- https://convertio.co/png-ico/
- https://www.icoconverter.com/

### Using ImageMagick
```bash
convert icon.png -define icon:auto-resize=256,128,64,48,32,16 assets/icon.ico
```

### Using GIMP
1. Open your PNG in GIMP
2. File → Export As
3. Choose .ico format
4. Select multiple sizes: 16, 32, 48, 64, 128, 256

## Building the Portable Executable

### Install Dependencies
```bash
pnpm install
```

### Build for Windows 7 32-bit
```bash
pnpm run build:portable
```

This will:
1. Compile TypeScript files
2. Build the React frontend with Vite
3. Package everything into a portable executable
4. Output: `dist-builder/BilibiliDownloader-Portable.exe`

## Build Optimizations

The build process includes several optimizations to keep the bundle size under 150MB:

### Code Splitting
- React and ReactDOM are bundled separately
- Axios is bundled separately
- CSS is code-split

### Minification
- JavaScript is minified with Terser
- Console logs and debuggers are removed in production
- Source maps are disabled

### Compression
- Maximum compression is enabled in electron-builder
- Files are packed into an ASAR archive
- Unnecessary node_modules files are excluded

### Excluded Files
- TypeScript definition files (*.d.ts)
- Source maps (*.map)
- Test files and directories
- Documentation files (README, CHANGELOG)
- Development configuration files

## Bundle Size Target

Target: < 150MB

To check the bundle size:
```bash
# After building
ls -lh dist-builder/BilibiliDownloader-Portable.exe
```

## Troubleshooting

### Build Fails - Missing Icon
Error: `Application icon is not set`

Solution: Create `assets/icon.ico` as described above

### Bundle Too Large
If the bundle exceeds 150MB:

1. Check for unnecessary dependencies in package.json
2. Review the files included in electron-builder.yml
3. Consider using external dependencies (not recommended for portable)
4. Analyze bundle with `npm run build -- --analyze`

### Windows 7 Compatibility
The build uses Electron 22.x, which is the last version supporting Windows 7 32-bit.
Do not upgrade Electron beyond version 22.x.

## Testing the Build

1. Copy `BilibiliDownloader-Portable.exe` to a Windows 7 32-bit machine
2. Run the executable (no installation required)
3. Test all features:
   - Search functionality
   - Video preview in browser
   - Video download to desktop
   - Error handling

## Distribution

The portable executable can be distributed via:
- USB drives
- Network shares
- Direct download

No installation or administrator privileges required.
