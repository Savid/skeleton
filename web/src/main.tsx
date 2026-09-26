import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider, createRouter } from '@tanstack/react-router';
import { routeTree } from '@/routeTree.gen';
import { ErrorPage } from '@/pages/error/ErrorPage';
import { NotFoundPage } from '@/pages/not-found/NotFoundPage';
import './index.css';

// The event stream writes fresh values into the cache, so a remount or a
// window focus within staleTime reads the cache instead of refetching. Queries
// the stream does not cover still refetch once older than this, and a page can
// set its own staleTime or refetchInterval where it wants different behaviour.
const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: 30_000 } } });

const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
  defaultNotFoundComponent: () => <NotFoundPage />,
  defaultErrorComponent: ({ error, reset }) => <ErrorPage error={error} reset={reset} />,
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

const root = document.getElementById('root');
if (!root) throw new Error('missing #root');

createRoot(root).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>
);
