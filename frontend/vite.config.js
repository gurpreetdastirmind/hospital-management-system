import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        // Fix: manualChunks should be a function, not an object
        manualChunks(id) {
          if (id.includes('node_modules')) {
            // Split vendor chunks for better caching
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) {
              return 'vendor-react';
            }
            return 'vendor';
          }
        }
      }
    },
  },
  // Important: This ensures env variables are available
  define: {
    'process.env.VITE_API_URL': JSON.stringify(process.env.VITE_API_URL)
  }
})