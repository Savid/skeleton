import { QueryClient } from '@tanstack/react-query';
import { getConfigQueryKey } from '@/api/@tanstack/react-query.gen';
import { getInjectedConfig } from './config';

/**
 * The app's query client. The event stream writes fresh values into the
 * cache, so a remount or a window focus within staleTime reads the cache
 * instead of refetching; queries the stream does not cover still refetch once
 * older than this, and a page can set its own staleTime or refetchInterval.
 *
 * The configuration the server injected into the page seeds the cache, so
 * the first render does not wait for it.
 */
export function createQueryClient(injected = getInjectedConfig()): QueryClient {
  const client = new QueryClient({ defaultOptions: { queries: { staleTime: 30_000 } } });
  if (injected) client.setQueryData(getConfigQueryKey(), injected);
  return client;
}
