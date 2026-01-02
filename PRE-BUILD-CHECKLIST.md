# Pre-Build Checklist

Before building the portable executable, ensure all these items are completed:

## Required Items

- [ ] **Application Icon Created**
  - File location: `assets/icon.ico`
  - Format: Windows ICO format
  - Sizes included: 16x16, 32x32, 48x48, 64x64, 128x128, 256x256
  - See `assets/icon-placeholder.txt` for instructions

- [ ] **Dependencies Installed**
  ```bash
  pnpm install
  ```

- [ ] **All Tests Passing**
  ```bash
  npm test
  ```

- [ ] **TypeScript Compilation Successful**
  ```bash
  npm run compile:electron
  ```

- [ ] **Frontend Build Successful**
  ```bash
  vite build
  ```

## Optimization Checks

- [ ] **Source Maps Disabled**
  - Check `vite.config.ts`: `sourcemap: false`

- [ ] **Console Logs Removed**
  - Check `vite.config.ts`: `drop_console: true`

- [ ] **Terser Installed**
  ```bash
  npm list terser
  ```

- [ ] **Unused Dependencies Removed**
  ```bash
  npm prune --production
  ```

- [ ] **Tailwind CSS Purging Configured**
  - Check `tailwind.config.js`: content paths are correct

## Configuration Checks

- [ ] **Electron Builder Configuration**
  - File exists: `electron-builder.yml` or `.electron-builder.config.js`
  - Target: `portable`
  - Architecture: `ia32` (32-bit)
  - Compression: `maximum`

- [ ] **Package.json Correct**
  - Main entry point: `dist-electron/electron/main.js`
  - Build script exists: `build:portable`

- [ ] **Electron Version**
  - Version 22.x (last version supporting Windows 7 32-bit)
  - Check: `npm list electron`

## Build Process

1. **Clean Previous Builds**
   ```bash
   rm -rf dist dist-electron dist-builder
   ```

2. **Run Build**
   ```bash
   npm run build:portable
   ```

3. **Analyze Bundle Size**
   ```bash
   npm run analyze
   ```

4. **Verify Output**
   - File exists: `dist-builder/BilibiliDownloader-Portable.exe`
   - File size: < 150 MB
   - File is executable

## Testing the Build

- [ ] **Copy to Test Environment**
  - Copy `BilibiliDownloader-Portable.exe` to a clean Windows 7 32-bit machine

- [ ] **Run Without Installation**
  - Double-click the executable
  - Should start without requiring installation

- [ ] **Test Core Features**
  - [ ] Application starts within 2 seconds
  - [ ] Search functionality works
  - [ ] Video cards display correctly
  - [ ] Preview in browser works
  - [ ] Download to desktop works
  - [ ] Error messages display correctly

- [ ] **Test Edge Cases**
  - [ ] No internet connection (should show error)
  - [ ] Invalid search query (should handle gracefully)
  - [ ] Disk space full (should show error)
  - [ ] Filename conflicts (should append number)

## Post-Build Verification

- [ ] **Bundle Size Check**
  ```bash
  ls -lh dist-builder/BilibiliDownloader-Portable.exe
  ```
  - Should be < 150 MB

- [ ] **No Residual Files**
  - Run the application
  - Close it
  - Check that no files are left in temp directories

- [ ] **Memory Usage**
  - Run the application
  - Check Task Manager
  - Should use < 100 MB RAM during normal operation

## Distribution Preparation

- [ ] **Virus Scan**
  - Scan the executable with antivirus software
  - Ensure no false positives

- [ ] **Documentation**
  - [ ] README.md is up to date
  - [ ] BUILD.md is complete
  - [ ] User guide is available (if needed)

- [ ] **Version Number**
  - Update version in `package.json`
  - Tag the release in git

## Common Issues

### Build Fails - Missing Icon
**Solution:** Create `assets/icon.ico` (see icon-placeholder.txt)

### Build Fails - TypeScript Errors
**Solution:** Run `npm run compile:electron` to see errors

### Bundle Too Large
**Solution:** See OPTIMIZATION.md for optimization strategies

### Executable Won't Run on Windows 7
**Solution:** Verify Electron version is 22.x (not higher)

## Build Command Reference

```bash
# Full build with analysis
npm run build:analyze

# Build only
npm run build:portable

# Analyze existing build
npm run analyze

# Clean build
rm -rf dist dist-electron dist-builder && npm run build:portable
```

## Success Criteria

✓ Build completes without errors
✓ Executable file is created
✓ File size is < 150 MB
✓ Application runs on Windows 7 32-bit
✓ All core features work
✓ No residual files after closing
✓ Memory usage < 100 MB

---

**Ready to build?** Run: `npm run build:portable`
