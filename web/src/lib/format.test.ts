import { describe, expect, it } from 'vitest';
import { formatAge } from './format';

describe('formatAge', () => {
  it('scales from tenths of a second to hours', () => {
    const now = Date.parse('2026-09-26T12:00:00Z');
    expect(formatAge('2026-09-26T11:59:59.700Z', now)).toBe('0.3 s');
    expect(formatAge('2026-09-26T11:59:48Z', now)).toBe('12 s');
    expect(formatAge('2026-09-26T11:56:00Z', now)).toBe('4 min');
    expect(formatAge('2026-09-26T09:00:00Z', now)).toBe('3 h');
  });

  it('never goes negative', () => {
    expect(formatAge('2026-09-26T12:00:05Z', Date.parse('2026-09-26T12:00:00Z'))).toBe('0.0 s');
  });
});
