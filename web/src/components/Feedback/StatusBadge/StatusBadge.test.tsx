import { describe, expect, it } from 'vitest';
import { render, screen } from '@/test-utils';
import { StatusBadge } from './StatusBadge';

describe('StatusBadge', () => {
  it('renders its label with the requested tone', () => {
    render(<StatusBadge tone="ok">online</StatusBadge>);

    const badge = screen.getByText('online');
    expect(badge).toHaveAttribute('data-tone', 'ok');
    expect(badge).toHaveClass('text-ok');
  });

  it('defaults to neutral', () => {
    render(<StatusBadge>idle</StatusBadge>);

    expect(screen.getByText('idle')).toHaveAttribute('data-tone', 'neutral');
  });
});
