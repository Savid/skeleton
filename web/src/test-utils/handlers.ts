import { delay, http, HttpResponse } from 'msw';
import type { Health } from '@/api';

// Fixtures are typed with the generated types, so a spec change that breaks
// them fails typecheck. Split this file by domain as it grows.

export const healthFixture: Health = { status: 'ok', version: '0.1.0', at: '2026-09-26T12:00:00.000Z' };

/** MSW handlers for GET /api/v1/health, one per state a story needs. */
export const healthHandlers = {
  ok: http.get('/api/v1/health', () => HttpResponse.json(healthFixture)),
  down: http.get('/api/v1/health', () => new HttpResponse(null, { status: 502 })),
  pending: http.get('/api/v1/health', async () => {
    await delay('infinite');
    return HttpResponse.json(healthFixture);
  }),
};
