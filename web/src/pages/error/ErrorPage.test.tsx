import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@/test-utils';
import { ErrorPage } from './ErrorPage';

describe('ErrorPage', () => {
  it('shows the error, retries, and links home', () => {
    const reset = vi.fn();
    render(<ErrorPage error={new Error('the stream exploded')} reset={reset} />);

    expect(screen.getByRole('alert')).toHaveTextContent('the stream exploded');
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(reset).toHaveBeenCalledOnce();
    expect(screen.getByRole('link', { name: 'Back home' })).toHaveAttribute('href', '/');
  });

  it('falls back to a generic message for errors without one', () => {
    render(<ErrorPage error={undefined} reset={() => {}} />);

    expect(screen.getByRole('alert')).toHaveTextContent('Something went wrong');
  });
});
