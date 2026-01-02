# Bundle Size Optimization Guide

This document describes the optimizations implemented to keep the bundle size under 150MB.

## Current Optimizations

### 1. Code Splitting (Vite Configuration)

**Location:** `vite.config.ts`

```typescript
manualChunks: {
  'react-vendor': ['react', 'react-dom'],
  'axios-vendor': ['axios'],
}
```

**Impact:** Separates vendor libraries into separate chunks, improving caching and reducing main bundle size.

### 2. Minification (Vite Configuration)

**Location:** `vite.config.ts`

```typescript
minify: 'terser',
terserOptions: {
  compress: {
    drop_console: true,
    drop_debugger: true,
  },
}
```

**Impact:** 
- Removes console.log statements in production
- Removes debugger statements
- Minifies JavaScript code
- Estimated savings: 10-15%

### 3. CSS Code Splitting

**Location:** `vite.config.ts`

```typescript
cssCodeSplit: true
```

**Impact:** Splits CSS into separate files per component, reducing initial load size.

### 4. Source Map Removal

**Location:** `vite.config.ts`

```typescript
sourcemap: false
```

**Impact:** Removes source maps from production build. Source maps can be 2-3x the size of the code.
**Estimated savings:** 20-30%

### 5. Tailwind CSS Purging

**Location:** `tailwind.config.js`

```javascript
content: [
  "./index.html",
  "./src/**/*.{js,ts,jsx,tsx}",
]
```

**Impact:** Removes unused CSS classes from the final bundle.
**Estimated savings:** 90% of Tailwind CSS (from ~3MB to ~300KB)

### 6. ASAR Archive Packaging

**Location:** `electron-builder.yml` / `.electron-builder.config.js`

```yaml
asar: true
compression: maximum
```

**Impact:** 
- Packs all files into a single archive
- Applies maximum compression
- Estimated savings: 15-25%

### 7. Node Modules Exclusion

**Location:** `.electron-builder.config.js`

```javascript
files: [
  '!node_modules/**/{CHANGELOG.md,README.md,README,readme.md,readme}',
  '!node_modules/**/{test,__tests__,tests,powered-test,example,examples}',
  '!node_modules/**/*.d.ts',
  '!node_modules/**/*.map',
  // ... more exclusions
]
```

**Impact:** Excludes unnecessary files from node_modules:
- Documentation files
- Test files
- TypeScript definition files
- Source maps
- **Estimated savings:** 20-30%

### 8. Development Dependencies Exclusion

**Location:** `.electron-builder.config.js`

```javascript
nodeModulesSkip: [
  'typescript',
  'ts-jest',
  'jest',
  '@types',
  'vite',
  'electron-builder',
]
```

**Impact:** Ensures development dependencies are not included in the final bundle.

## Analyzing Bundle Size

### Run Analysis

```bash
npm run analyze
```

This will show:
- Frontend build size (dist/)
- Electron build size (dist-electron/)
- Final executable size
- Percentage of target (150MB)

### Build and Analyze

```bash
npm run build:analyze
```

This will build the application and then run the analysis.

## Bundle Size Breakdown (Estimated)

| Component | Size | Percentage |
|-----------|------|------------|
| Electron Runtime (v22, 32-bit) | ~80-90 MB | 60% |
| React + ReactDOM | ~5-8 MB | 5% |
| Application Code | ~2-3 MB | 2% |
| Axios | ~1-2 MB | 1% |
| Tailwind CSS (purged) | ~300 KB | 0.2% |
| Other Dependencies | ~10-15 MB | 10% |
| Assets (icons, etc.) | ~1-2 MB | 1% |
| **Total (estimated)** | **~100-120 MB** | **~70-80% of target** |

## Further Optimization Strategies

If the bundle size exceeds 150MB, consider these additional optimizations:

### 1. Lazy Loading Components

```typescript
const VideoCard = lazy(() => import('./components/VideoCard'));
```

### 2. Remove Unused Dependencies

Review `package.json` and remove any dependencies that aren't actually used.

```bash
npm install -g depcheck
depcheck
```

### 3. Use Lighter Alternatives

- Consider replacing heavy libraries with lighter alternatives
- Example: Use native fetch instead of axios (saves ~1-2 MB)

### 4. Optimize Images

- Compress icon files
- Use WebP format for images
- Remove unused images

### 5. Tree Shaking

Ensure all imports use named imports to enable tree shaking:

```typescript
// Good - enables tree shaking
import { useState, useEffect } from 'react';

// Bad - imports entire library
import * as React from 'react';
```

### 6. External Dependencies

For very large dependencies, consider loading them externally (not recommended for portable executable).

## Monitoring Bundle Size

### During Development

Add a pre-commit hook to check bundle size:

```bash
npm run build:portable
npm run analyze
```

### CI/CD Integration

Add bundle size checks to your CI/CD pipeline to prevent size regressions.

## Target Compliance

**Target:** < 150 MB
**Current Estimate:** ~100-120 MB
**Margin:** ~30-50 MB (20-33%)

The current optimizations should keep the bundle well within the target size.

## Troubleshooting

### Bundle Size Suddenly Increased

1. Check for new dependencies in `package.json`
2. Run `npm run analyze` to see the breakdown
3. Use `npm ls` to check for duplicate dependencies
4. Check if source maps were accidentally included

### Optimization Not Working

1. Ensure you're building in production mode
2. Check that terser is installed: `npm install -D terser`
3. Verify electron-builder configuration is being used
4. Clear build cache: `rm -rf dist dist-electron dist-builder`

## References

- [Vite Build Optimizations](https://vitejs.dev/guide/build.html)
- [Electron Builder Configuration](https://www.electron.build/configuration/configuration)
- [Tailwind CSS Optimization](https://tailwindcss.com/docs/optimizing-for-production)
