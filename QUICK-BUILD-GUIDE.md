# Quick Build Guide

## TL;DR - Build in 3 Steps

### 1. Create Icon
```bash
# Place your icon file at:
assets/icon.ico
```
See `assets/icon-placeholder.txt` for instructions.

### 2. Install Dependencies
```bash
pnpm install
```

### 3. Build
```bash
npm run build:portable
```

Output: `dist-builder/BilibiliDownloader-Portable.exe`

---

## Verify Bundle Size

```bash
npm run analyze
```

Expected: < 150 MB

---

## Full Documentation

- **Build Instructions:** See [BUILD.md](BUILD.md)
- **Optimization Details:** See [OPTIMIZATION.md](OPTIMIZATION.md)
- **Pre-Build Checklist:** See [PRE-BUILD-CHECKLIST.md](PRE-BUILD-CHECKLIST.md)

---

## Troubleshooting

### "Application icon is not set"
→ Create `assets/icon.ico` (see icon-placeholder.txt)

### "Cannot find module 'terser'"
→ Run `pnpm install`

### Bundle size > 150 MB
→ See [OPTIMIZATION.md](OPTIMIZATION.md) for optimization strategies

---

## Build Commands Reference

| Command | Description |
|---------|-------------|
| `npm run build:portable` | Build portable executable |
| `npm run build:analyze` | Build and analyze size |
| `npm run analyze` | Analyze existing build |
| `npm run compile:electron` | Compile Electron code only |

---

**Ready?** → `npm run build:portable`
