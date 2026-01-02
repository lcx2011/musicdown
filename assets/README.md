# Application Assets

This directory contains the application icon and other assets used by the Bilibili Downloader.

## Icon Files

### icon.ico
The main application icon used by Electron Builder for the Windows executable.

- **Format**: Windows ICO
- **Dimensions**: 256x256 pixels
- **Color Depth**: 32-bit RGBA (with transparency)
- **File Size**: ~256 KB

### icon.svg
Vector source file for the icon, useful for regenerating or modifying the icon.

- **Format**: SVG (Scalable Vector Graphics)
- **Dimensions**: 256x256 viewBox
- **Design**: Bilibili-themed with blue gradient background, video player symbol, and download arrow

## Icon Design

The icon features:
- **Background**: Bilibili brand blue gradient (#00A1D6 to #0084B8)
- **Shape**: Rounded square with 48px corner radius
- **Video Symbol**: White rectangle with play triangle (representing video content)
- **Download Arrow**: White arrow pointing down (representing download functionality)
- **Style**: Modern, flat design suitable for Windows 7 and later

## Regenerating the Icon

If you need to modify or regenerate the icon:

1. **Edit the SVG** (optional):
   ```bash
   # Edit assets/icon.svg with any SVG editor
   ```

2. **Generate new SVG** (if needed):
   ```bash
   node scripts/generate-icon.js
   ```

3. **Create ICO file**:
   ```bash
   node scripts/create-simple-icon.js
   ```

4. **Verify the icon**:
   ```bash
   node scripts/verify-icon.js
   ```

## Alternative Methods

### Using ImageMagick
If you have ImageMagick installed:
```bash
magick convert assets/icon.svg -define icon:auto-resize=256,128,64,48,32,16 assets/icon.ico
```

### Using Online Tools
1. Go to https://convertio.co/svg-ico/
2. Upload `assets/icon.svg`
3. Download the converted `icon.ico`
4. Save it as `assets/icon.ico`

## Build Integration

The icon is automatically included in the build process via `electron-builder.yml`:

```yaml
win:
  icon: assets/icon.ico
```

No additional configuration is needed.
