import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { playwright } from '@vitest/browser-playwright';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import path from 'path';

const dirname = import.meta.dirname;

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(dirname, './src'),
    },
  },
  test: {
    restoreMocks: true,
    unstubGlobals: true,
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/api/**',
        'src/routeTree.gen.ts',
        'src/test-utils/**',
        'src/**/*.{test,stories}.{ts,tsx}',
        'src/**/*.d.ts',
      ],
    },
    projects: [
      {
        // Component and page tests in jsdom.
        extends: true,
        plugins: [react()],
        test: {
          name: 'unit',
          environment: 'jsdom',
          include: ['src/**/*.test.{ts,tsx}'],
          setupFiles: ['./src/test-utils/setup.ts'],
        },
      },
      {
        // Every story is a test: it must render, pass its play function and
        // have no accessibility violations, in headless Chromium.
        extends: true,
        plugins: [
          tailwindcss(),
          storybookTest({ configDir: path.join(dirname, '.storybook'), storybookScript: 'pnpm storybook' }),
        ],
        publicDir: path.join(dirname, '.storybook/public'),
        test: {
          name: 'storybook',
          setupFiles: ['./.storybook/vitest-setup.ts'],
          browser: {
            enabled: true,
            headless: true,
            provider: playwright({ contextOptions: { locale: 'en-US', timezoneId: 'UTC', reducedMotion: 'reduce' } }),
            instances: [{ browser: 'chromium' }],
          },
        },
      },
    ],
  },
});
