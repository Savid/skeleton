import { describe, expect, it } from 'vitest';
import { render, screen } from '@/test-utils';
import { NotFoundPage } from './NotFoundPage';

describe('NotFoundPage', () => {
  it('links back home', () => {
    render(<NotFoundPage />);

    expect(screen.getByRole('heading', { name: 'Not found' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Back home' })).toHaveAttribute('href', '/');
  });
});
