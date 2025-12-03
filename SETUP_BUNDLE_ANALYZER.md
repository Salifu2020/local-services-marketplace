# Bundle Analyzer Setup

## Installation

The bundle analyzer requires an additional package. Install it with:

```bash
npm install --save-dev rollup-plugin-visualizer
```

## Usage

After installation, run:

```bash
npm run build
```

This will:
1. Build your app
2. Generate `dist/stats.html` with bundle visualization
3. Automatically open it in your browser

## Viewing Results

1. Open `dist/stats.html` in your browser
2. You'll see:
   - Visual tree map of your bundle
   - File sizes (original, gzip, brotli)
   - Chunk breakdown
   - Dependency analysis

## What to Look For

- **Large chunks:** Identify what's making bundles large
- **Duplicate dependencies:** Find libraries included multiple times
- **Unused code:** Spot opportunities for tree-shaking
- **Vendor chunks:** Verify vendor splitting is working

## Tips

- Run after adding new dependencies
- Compare before/after major changes
- Set bundle size budgets
- Track over time

---

**Note:** The bundle analyzer is already configured in `vite.config.js`. Just install the package and build!

