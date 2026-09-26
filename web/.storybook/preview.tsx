import type { Decorator, Preview } from '@storybook/react-vite';
import { useState, type JSX, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createMemoryHistory, createRouter, RouterContextProvider } from '@tanstack/react-router';
import { http, HttpResponse } from 'msw';
import { setupWorker, type SetupWorker } from 'msw/browser';
import { mswLoader } from 'msw-storybook-addon/csf3';
import { routeTree } from '@/routeTree.gen';
import '@/index.css';

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

const preview: Preview = {
  decorators: [withProviders],
  loaders: [mswLoader(startWorker)],
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    // Accessibility violations fail the story's test.
    a11y: { test: 'error' },
    controls: {
      matchers: { color: /(background|color)$/i, date: /Date$/i },
    },
  },
};

export default preview;
