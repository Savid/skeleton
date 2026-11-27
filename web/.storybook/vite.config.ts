import babel from '@rolldown/plugin-babel';
import { reactCompilerPreset } from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { msw } from 'msw/vite';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';

/**
 * Preview compilation only; Storybook supplies the React plugin. MSW serves
 * and emits its worker script; preview.tsx starts the worker itself. React
 * Compiler runs here too, so stories and their tests render what ships.
 */
export default defineConfig({
  plugins: [tailwindcss(), msw({ mode: 'worker-only' }), babel({ presets: [reactCompilerPreset()] })],
  resolve: { alias: { '@': resolve(import.meta.dirname, '../src') } },
});
