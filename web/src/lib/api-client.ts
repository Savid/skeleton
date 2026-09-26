import type { CreateClientConfig } from '@/api/client.gen';

/**
 * Settings for the generated API client. The API is served by the page's own
 * origin; an absolute base URL also works where relative requests don't (jsdom).
 */
export const createClientConfig: CreateClientConfig = config => ({ ...config, baseUrl: window.location.origin });
