import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { tanstackRouter } from '@tanstack/router-plugin/vite';
import path from 'path';

// `pnpm dev` proxies /api/ to a local skeletond (`make run`). Override with
// API=http://host:port to point at another one.
const api = process.env.API ?? 'http://127.0.0.1:8080';

export default defineConfig({
  plugins: [
    tanstackRouter({
      routesDirectory: './src/routes',
      generatedRouteTree: './src/routeTree.gen.ts',
      routeFileIgnorePattern: '\\.test\\.',
      autoCodeSplitting: true,
      quoteStyle: 'single',
    }),
    tailwindcss(),
    react(),
  ],
  server: {
    proxy: {
      '/api/': { target: api, changeOrigin: true, ws: true },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
  },
});
