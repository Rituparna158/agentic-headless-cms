/// <reference types="vitest" />
import { defineConfig, type PluginOption } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    ...(process.env.ANALYZE === 'true'
      ? [
          visualizer({
            filename: 'dist/stats.html',
            open: false,
            gzipSize: true,
            brotliSize: true,
          }) as PluginOption,
        ]
      : []),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3003,
    strictPort: true,
    headers: {
      // Content Security Policy (CSP) headers for security
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
    },
  },
  build: {
    sourcemap: mode !== 'production',
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (
              id.includes('grapesjs-blocks-basic') ||
              id.includes('grapesjs-plugin-forms') ||
              id.includes('grapesjs-preset-webpage')
            ) {
              return 'grapesjs-plugins';
            }
            if (id.includes('grapesjs')) {
              return 'grapesjs';
            }
            if (id.includes('html2canvas')) {
              return 'html2canvas';
            }
            if (id.includes('html2pdf.js')) {
              return 'html2pdf';
            }
            if (id.includes('@mindfiredigital/page-builder')) {
              return 'page-builder';
            }
            if (id.includes('lucide-react')) {
              return 'icons';
            }
            if (
              id.includes('react/') ||
              id.includes('react-dom/') ||
              id.includes('react-router') ||
              id.includes('zustand') ||
              id.includes('@tanstack/react-query')
            ) {
              return 'vendor';
            }
          }
          if (id.includes('/packages/shared-ui/')) {
            return 'ui';
          }
        },
      },
    },
    target: 'esnext',
    minify: 'esbuild',
  },
}));
