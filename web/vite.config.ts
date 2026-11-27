import { defineConfig } from 'vite';
import babel from '@rolldown/plugin-babel';
import react, { reactCompilerPreset } from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { tanstackRouter } from '@tanstack/router-plugin/vite';
import path from 'path';

// `pnpm dev` proxies /api/ to a local skeletond (`make run`). Override with
// API=http://host:port to point at another one. The browser's Host goes
// through unchanged (no changeOrigin), so skeletond's write check finds
// Origin and Host agree wherever the browser sends no Sec-Fetch-Site.
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
    // React Compiler memoizes components and hooks; the react-hooks lint rules
    // keep code it can compile (eslint.config.js).
    babel({ presets: [reactCompilerPreset()] }),
  ],
  server: {
    proxy: {
      '/api/': { target: api, ws: true },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    // Emit every asset as a file. Inlined ones become data: URLs, which the
    // page's Content-Security-Policy (internal/ui) refuses.
    assetsInlineLimit: 0,
  },
});
