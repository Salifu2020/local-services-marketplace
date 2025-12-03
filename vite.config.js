import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer'

export default defineConfig({
  plugins: [
    react({
      // Ensure React is properly transformed
      jsxRuntime: 'automatic',
    }),
    // Bundle analyzer - generates stats.html in dist folder
    visualizer({
      filename: 'dist/stats.html',
      open: true,
      gzipSize: true,
      brotliSize: true,
    }),
  ],
  server: {
    port: 3001,
    open: true
  },
  preview: {
    port: 4173,
    strictPort: true,
    // Ensure proper MIME types for static assets
    headers: {
      'Cache-Control': 'public, max-age=31536000',
    },
  },
  build: {
    // Enable code splitting
    rollupOptions: {
      output: {
        // Manual chunk splitting for better caching
        manualChunks: (id) => {
          // CRITICAL: Keep ALL React-related code together to prevent loading issues
          // This includes React core, React DOM, and all React-dependent libraries
          if (id.includes('node_modules/react') || 
              id.includes('node_modules/react-dom') ||
              id.includes('node_modules/react/jsx-runtime') ||
              id.includes('node_modules/react-router') ||
              id.includes('node_modules/react-i18next') ||
              id.includes('node_modules/@stripe/react-stripe-js') ||
              id.includes('node_modules/@sentry/react') ||
              id.includes('node_modules/use-sync-external-store') ||
              id.includes('node_modules/scheduler')) {
            // Keep ALL React code in main bundle - don't split it
            return undefined;
          }
          
          // Firebase vendor chunk (handle Firebase's complex structure)
          if (id.includes('node_modules/firebase')) {
            return 'firebase-vendor';
          }
          
          // Other Sentry packages (not @sentry/react)
          if (id.includes('node_modules/@sentry')) {
            return 'sentry-vendor';
          }
          
          // Other large vendor libraries
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        },
        // Ensure proper chunk loading order
        entryFileNames: 'js/[name]-[hash].js',
        chunkFileNames: 'js/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
    // Optimize chunk size
    chunkSizeWarningLimit: 1000,
    // Enable source maps for production debugging (optional)
    sourcemap: false,
    // Minify using esbuild (faster than terser, no extra dependency)
    minify: 'esbuild',
    // Note: To use terser instead, install it: npm install -D terser
    // Then change minify to 'terser' and uncomment terserOptions below
    // terserOptions: {
    //   compress: {
    //     drop_console: true, // Remove console.log in production
    //   },
    // },
  },
  // Optimize dependencies
  optimizeDeps: {
    include: [
      'react', 
      'react/jsx-runtime',
      'react-dom', 
      'react-dom/client',
      'react-router-dom',
      'react-i18next',
      '@stripe/react-stripe-js'
    ],
    // Exclude Firebase from pre-bundling (it's ESM-only)
    exclude: ['firebase'],
  },
  // Ensure React is resolved correctly and prevent multiple instances
  resolve: {
    dedupe: ['react', 'react-dom'],
  },
})

