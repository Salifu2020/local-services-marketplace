# Build Configuration Fix

## Issue
Build was failing because:
1. Firebase package resolution error (fixed)
2. Terser not installed (fixed)

## Solution

### 1. Firebase Resolution
Changed `manualChunks` from object to function-based approach to handle Firebase's ESM structure.

### 2. Minifier
Changed from `terser` to `esbuild`:
- ✅ **esbuild** - Faster, no extra dependency (default in Vite)
- ⚠️ **terser** - More options, requires installation

## Current Configuration

**Minifier:** `esbuild` (default, fast, no dependencies)

**To use terser instead:**
```bash
npm install -D terser
```

Then in `vite.config.js`:
```javascript
minify: 'terser',
terserOptions: {
  compress: {
    drop_console: true,
  },
}
```

## Build Now Works

The build should now complete successfully with:
- ✅ Proper Firebase handling
- ✅ esbuild minification (fast)
- ✅ Code splitting
- ✅ Bundle optimization

---

**Note:** esbuild is faster and sufficient for most use cases. Only switch to terser if you need specific terser-only features.

