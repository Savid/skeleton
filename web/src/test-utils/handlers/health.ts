import { delay, http, HttpResponse } from 'msw';
import type { Health } from '@/api';
import { at } from '@/test-utils/time';

// Fixtures are typed with the generated types, so a spec change that breaks
// them fails typecheck. One file per API domain.

export const healthFixture: Health = { status: 'ok', version: '0.1.0', at: at(-12_000) };

/** MSW handlers for GET /api/v1/health, one per state a story needs. */
export const healthHandlers = {
  ok: http.get('/api/v1/health', () => HttpResponse.json(healthFixture)),
  down: http.get('/api/v1/health', () => new HttpResponse(null, { status: 502 })),
  pending: http.get('/api/v1/health', async () => {
    await delay('infinite');
    return HttpResponse.json(healthFixture);
  }),
};
