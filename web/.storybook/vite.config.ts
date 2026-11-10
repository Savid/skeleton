import tailwindcss from '@tailwindcss/vite';
import { msw } from 'msw/vite';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';

/**
 * Preview compilation only; Storybook supplies the React plugin. MSW serves
 * and emits its worker script; preview.tsx starts the worker itself.
 */
export default defineConfig({
  plugins: [tailwindcss(), msw({ mode: 'worker-only' })],
  resolve: { alias: { '@': resolve(import.meta.dirname, '../src') } },
});
