import type { Config } from '@/api';
import { zConfig } from '@/api/zod.gen';

declare global {
  interface Window {
    /** Set by the server in index.html; see internal/ui. */
    __CONFIG__?: unknown;
  }
}

/**
 * The configuration the server injected into the page, validated against
 * the generated schema, or undefined when there is none (the Vite dev server
 * serves the page unmodified) or it does not match the spec.
 */
export function getInjectedConfig(): Config | undefined {
  if (typeof window === 'undefined' || window.__CONFIG__ === undefined) return undefined;

  const parsed = zConfig.safeParse(window.__CONFIG__);
  if (!parsed.success) {
    console.error('the injected configuration does not match the spec', parsed.error);
    return undefined;
  }

  return parsed.data;
}
