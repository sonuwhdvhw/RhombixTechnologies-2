import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    target: 'es2020',
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          // React core
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          // Framer Motion (large)
          'vendor-motion': ['framer-motion'],
          // Three.js (large) — loaded lazily so won't block initial render
          'vendor-three': ['three'],
          // Supabase
          'vendor-supabase': ['@supabase/supabase-js'],
          // UI utilities
          'vendor-ui': ['lucide-react', 'clsx', 'tailwind-merge', 'date-fns'],
          // State & data fetching
          'vendor-state': ['zustand', '@tanstack/react-query'],
          // Socket + Axios
          'vendor-network': ['socket.io-client', 'axios'],
        },
      },
    },
  },
  // Preload critical chunks in dev as well
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'framer-motion', 'zustand'],
    exclude: ['three'], // don't pre-bundle Three.js; let lazy import handle it
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://localhost:5000',
        ws: true,
      },
    },
  },
});
