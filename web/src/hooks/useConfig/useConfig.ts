import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { getConfigOptions } from '@/api/@tanstack/react-query.gen';
import type { Config, GetConfigError } from '@/api';

/** How often the configuration is refetched; the page's injection covers the first render. */
const REFRESH_MS = 60_000;

/**
 * The public configuration. It is in the cache before the first render when
 * the server injected it into the page, and fetched otherwise (the Vite dev
 * server). It never goes stale on its own; a slow refetch picks up a new build.
 */
export function useConfig(): UseQueryResult<Config, GetConfigError> {
  return useQuery({ ...getConfigOptions(), staleTime: Infinity, refetchInterval: REFRESH_MS });
}
