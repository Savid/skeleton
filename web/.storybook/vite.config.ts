import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';

/** Preview compilation only; Storybook supplies the React plugin. */
export default defineConfig({
  plugins: [tailwindcss()],
  resolve: { alias: { '@': resolve(import.meta.dirname, '../src') } },
});
