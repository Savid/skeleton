import { zProblem } from '@/api/zod.gen';

/**
 * What went wrong with a failed request, for people. The generated client
 * throws the response body: an RFC 9457 problem when the server answered, text
 * or a network error when it did not.
 */
export function problemDetail(error: unknown, fallback: string): string {
  const parsed = zProblem.safeParse(error);
  if (!parsed.success) return fallback;

  return parsed.data.detail || parsed.data.title || fallback;
}
