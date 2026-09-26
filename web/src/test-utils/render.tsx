import type { ReactElement, ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createMemoryHistory, createRouter, RouterContextProvider } from '@tanstack/react-router';
import {
  render as rtlRender,
  renderHook as rtlRenderHook,
  type RenderHookResult,
  type RenderResult,
} from '@testing-library/react';
import { routeTree } from '@/routeTree.gen';

/** A query client that never retries, so failures show at once. */
function createTestQueryClient(): QueryClient {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

function wrapper(client: QueryClient): (props: { children: ReactNode }) => ReactElement {
  // Links resolve against the app's real routes; no route is rendered.
  const router = createRouter({ routeTree, history: createMemoryHistory({ initialEntries: ['/'] }) });

  return function Providers({ children }) {
    return (
      <QueryClientProvider client={client}>
        <RouterContextProvider router={router}>{children}</RouterContextProvider>
      </QueryClientProvider>
    );
  };
}

/** Renders with a fresh query client and the app's routes for links. */
export function render(ui: ReactElement, client = createTestQueryClient()): RenderResult & { client: QueryClient } {
  return Object.assign(rtlRender(ui, { wrapper: wrapper(client) }), { client });
}

/** Renders a hook with a fresh query client. */
export function renderHook<T>(
  hook: () => T,
  client = createTestQueryClient()
): RenderHookResult<T, unknown> & { client: QueryClient } {
  return Object.assign(rtlRenderHook(hook, { wrapper: wrapper(client) }), { client });
}
