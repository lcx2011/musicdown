# Testing Guide - IPC Implementation

## Quick Test

To verify the IPC implementation works correctly in Electron:

### 1. Start the Development Server

```bash
npm run dev
```

This will:
- Start Vite dev server on `http://localhost:5173`
- Launch Electron application
- Open DevTools automatically

### 2. Test Search Functionality

1. In the search input, type: `音乐` (or any search term)
2. Press Enter

### 3. Expected Results

✅ **Success Indicators:**
- Search results appear with video thumbnails
- No CORS errors in console
- No "Refused to set unsafe header" warnings
- No 412 errors
- Videos display with title, duration, uploader

❌ **Failure Indicators:**
- CORS error: `Access to XMLHttpRequest... has been blocked by CORS policy`
- 412 error: `GET https://api.bilibili.com/... net::ERR_FAILED 412`
- Unsafe header warning: `Refused to set unsafe header "User-Agent"`

### 4. Check Console Output

Open DevTools (should open automatically) and check:

**Main Process Console** (terminal where you ran `npm run dev`):
- Should show IPC requests being handled
- No errors

**Renderer Process Console** (DevTools in Electron window):
- Should show search results
- No CORS or 412 errors

## Debugging

### If Search Fails

1. **Check Electron Detection:**
   - Open DevTools console
   - Type: `process.versions.electron`
   - Should return a version string (e.g., "22.3.27")

2. **Check IPC Handler:**
   - Look at terminal output
   - Should see axios requests being made from main process

3. **Check Network Tab:**
   - Open DevTools Network tab
   - Search for a video
   - Should NOT see requests to `api.bilibili.com` (they go through IPC)

### If Tests Fail

```bash
npm test
```

All 117 tests should pass. If not:
- Check that `process.versions.electron` is undefined in test environment
- Verify mock data matches expected format

## Architecture Verification

### How It Works

1. **User searches** → SearchView component
2. **SearchView calls** → SearchService.search()
3. **SearchService calls** → APIClient.searchVideos()
4. **APIClient detects** → Electron environment (process.versions.electron)
5. **APIClient uses** → ipcRenderer.invoke('bilibili-search')
6. **Main process receives** → IPC message
7. **Main process makes** → axios request with full headers
8. **Main process returns** → response data
9. **Renderer receives** → search results
10. **UI updates** → displays videos

### Key Files

- `electron/main.ts` - IPC handler (`bilibili-search`)
- `src/services/APIClient.ts` - Electron detection and IPC call
- `src/services/SearchService.ts` - Search logic
- `src/components/SearchView.tsx` - UI component

## Common Issues

### Issue: Still getting CORS errors

**Cause:** Electron detection failing, using fallback HTTP path

**Solution:**
1. Verify `nodeIntegration: true` in `electron/main.ts`
2. Check `process.versions.electron` in console
3. Restart Electron app

### Issue: "Cannot read properties of undefined (reading 'invoke')"

**Cause:** `ipcRenderer` not available

**Solution:**
1. Verify `nodeIntegration: true` in `electron/main.ts`
2. Verify `contextIsolation: false` in `electron/main.ts`
3. Restart Electron app

### Issue: 412 errors still occurring

**Cause:** Headers not being sent correctly from main process

**Solution:**
1. Check `electron/main.ts` IPC handler
2. Verify headers include User-Agent and Referer
3. Check terminal output for axios errors

## Success Criteria

- [x] All 117 tests pass
- [ ] Search works in Electron without CORS errors
- [ ] Search works in Electron without 412 errors
- [ ] Video results display correctly
- [ ] Download functionality works
- [ ] No console errors

## Next Steps After Testing

Once testing is successful:
1. Test on Windows 7 32-bit VM
2. Build portable executable
3. Test portable executable on target system
4. Deploy to users

---

**Ready to test?** Run `npm run dev` and search for "音乐"!
