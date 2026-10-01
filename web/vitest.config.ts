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
    // Vitest stubs CSS imports; the token test reads tokens.css as text (`?raw`).
    css: { include: [/\/src\/styles\/tokens\.css/] },
    restoreMocks: true,
    unstubGlobals: true,
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/api/**',
        'src/routeTree.gen.ts',
        'src/test-utils/**',
        'src/design-docs/**',
        'src/styles/**',
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
        // have no accessibility violations, in headless Chromium, once under
        // each colour scheme (the stories follow it; see .storybook/preview.tsx).
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
            instances: (['light', 'dark'] as const).map(theme => ({
              browser: 'chromium' as const,
              name: `storybook:${theme}`,
              provider: playwright({
                contextOptions: { locale: 'en-US', timezoneId: 'UTC', reducedMotion: 'reduce', colorScheme: theme },
              }),
            })),
          },
        },
      },
    ],
  },
});
