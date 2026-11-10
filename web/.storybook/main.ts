import type { StorybookConfig } from '@storybook/react-vite';
import { resolve } from 'node:path';

const config: StorybookConfig = {
  // MDX first: glob order sets where docs pages sit in the sidebar.
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(ts|tsx)'],
  addons: ['@storybook/addon-docs', '@storybook/addon-vitest', '@storybook/addon-a11y', '@storybook/addon-themes'],
  framework: {
    name: '@storybook/react-vite',
    options: {
      // Not the app's vite.config.ts: the router generator belongs to the app entry.
      builder: { viteConfigPath: resolve(import.meta.dirname, 'vite.config.ts') },
    },
  },
  core: {
    disableTelemetry: true,
  },
  // body paints bg-background from the tokens; a second background source would disagree.
  features: { backgrounds: false },
};

export default config;
