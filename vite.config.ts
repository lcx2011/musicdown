import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      // Alias electron and node modules to empty modules in browser
      'electron': resolve(__dirname, './src/utils/electron-mock.ts'),
      'fs': resolve(__dirname, './src/utils/node-mock.ts'),
      'path': resolve(__dirname, './src/utils/node-mock.ts'),
      'os': resolve(__dirname, './src/utils/node-mock.ts'),
      'crypto': resolve(__dirname, './src/utils/crypto-mock.ts'),
    },
  },
  base: './',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
    rollupOptions: {
      external: ['electron', 'fs', 'path', 'os', 'crypto'],
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'axios-vendor': ['axios'],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
    sourcemap: false,
    cssCodeSplit: true,
  },
  server: {
    port: 5173,
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
  },
  optimizeDeps: {
    exclude: ['electron', 'fs', 'path', 'os', 'crypto'],
  },
});
