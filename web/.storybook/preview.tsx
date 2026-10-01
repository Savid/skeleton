import type { Decorator, Preview } from '@storybook/react-vite';
import { withThemeByDataAttribute } from '@storybook/addon-themes';
import { useState, type JSX, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createMemoryHistory, createRouter, RouterContextProvider } from '@tanstack/react-router';
import { http, HttpResponse } from 'msw';
import { setupWorker, type SetupWorker } from 'msw/browser';
import { mswLoader } from 'msw-storybook-addon/csf3';
import { routeTree } from '@/routeTree.gen';
import './preview.css';

// An /api/ request a story did not mock is a defect: answer 404 and log it,
// which fails the story's test (see vitest-setup.ts). Stories add handlers
// with `parameters.msw.handlers`; those take precedence over this one.
const unmockedApi = http.all('/api/*', ({ request }) => {
  console.error(`Unmocked API request in story: ${request.method} ${new URL(request.url).pathname}`);
  return new HttpResponse(null, { status: 404 });
});

async function startWorker(): Promise<SetupWorker> {
  const worker = setupWorker(unmockedApi);
  await worker.start({ onUnhandledRequest: 'bypass', quiet: true });
  return worker;
}

/**
 * A fresh query cache and router per story, so no story sees another's state.
 * Links resolve against the app's real routes; no route is rendered.
 */
function StoryProviders({ children }: { children: ReactNode }): JSX.Element {
  const [client] = useState(() => new QueryClient({ defaultOptions: { queries: { retry: false } } }));
  const [router] = useState(() => createRouter({ routeTree, history: createMemoryHistory({ initialEntries: ['/'] }) }));

  return (
    <QueryClientProvider client={client}>
      <RouterContextProvider router={router}>{children}</RouterContextProvider>
    </QueryClientProvider>
  );
}

const withProviders: Decorator = Story => (
  <StoryProviders>
    <Story />
  </StoryProviders>
);

/**
 * Stories start in the system's colour scheme, as the app does. Vitest runs
 * every story under each scheme (vitest.config.ts), so each theme is tested.
 */
const defaultTheme = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';

const preview: Preview = {
  decorators: [
    withProviders,
    // The toolbar's theme switch: data-theme on <html>, as tokens.css expects.
    withThemeByDataAttribute({
      themes: { light: 'light', dark: 'dark' },
      defaultTheme,
    }),
  ],
  loaders: [mswLoader(startWorker)],
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    // Accessibility violations fail the story's test.
    a11y: { test: 'error' },
    controls: {
      matchers: { color: /(background|color)$/i, date: /Date$/i },
    },
    options: {
      storySort: {
        order: ['Foundations', ['Introduction', 'Colours', 'Typography', 'Layout'], 'Components', 'Pages', '*'],
      },
    },
  },
};

export default preview;
