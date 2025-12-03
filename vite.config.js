import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer'

export default defineConfig({
  plugins: [
    react(),
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
  build: {
    // Enable code splitting
    rollupOptions: {
      output: {
        // Manual chunk splitting for better caching
        manualChunks: (id) => {
          // React vendor chunk
          if (id.includes('node_modules/react') || 
              id.includes('node_modules/react-dom') || 
              id.includes('node_modules/react-router')) {
            return 'react-vendor';
          }
          
          // Firebase vendor chunk (handle Firebase's complex structure)
          if (id.includes('node_modules/firebase')) {
            return 'firebase-vendor';
          }
          
          // Sentry vendor chunk
          if (id.includes('node_modules/@sentry')) {
            return 'sentry-vendor';
          }
          
          // Other node_modules go into vendor chunk
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        },
        // Optimize chunk file names
        chunkFileNames: 'js/[name]-[hash].js',
        entryFileNames: 'js/[name]-[hash].js',
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
    include: ['react', 'react-dom', 'react-router-dom'],
    // Exclude Firebase from pre-bundling (it's ESM-only)
    exclude: ['firebase'],
  },
})

