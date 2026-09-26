import { describe, expect, it } from 'vitest';
import { problemDetail } from './problem';

describe('problemDetail', () => {
  it('prefers the detail, then the title, then the fallback', () => {
    expect(problemDetail({ status: 409, title: 'Conflict', detail: 'already running' }, 'failed')).toBe(
      'already running'
    );
    expect(problemDetail({ status: 502, title: 'Bad Gateway' }, 'failed')).toBe('Bad Gateway');
    expect(problemDetail(new TypeError('Failed to fetch'), 'failed')).toBe('failed');
    expect(problemDetail('upstream error', 'failed')).toBe('failed');
    expect(problemDetail(undefined, 'failed')).toBe('failed');
  });
});
