import { describe, expect, it } from 'vitest';
import { render, screen, server } from '@/test-utils';
import { healthHandlers } from '@/test-utils/handlers';
import { NOW_MS } from '@/test-utils/time';
import { HealthCard } from './HealthCard';

const now = NOW_MS;

describe('HealthCard', () => {
  it('shows the version and the age of the last answer', async () => {
    server.use(healthHandlers.ok);
    render(<HealthCard now={now} />);

    expect(await screen.findByText('0.1.0')).toBeInTheDocument();
    expect(screen.getByText('12 s ago')).toBeInTheDocument();
    expect(screen.getByText('ok')).toHaveAttribute('data-tone', 'ok');
  });

  it('says while it is loading', () => {
    server.use(healthHandlers.pending);
    render(<HealthCard now={now} />);

    expect(screen.getByRole('status')).toHaveTextContent("Loading the server's health…");
    expect(screen.getByText('connecting')).toHaveAttribute('data-tone', 'neutral');
  });

  it('says when the server cannot be reached', async () => {
    server.use(healthHandlers.down);
    render(<HealthCard now={now} />);

    expect(await screen.findByRole('alert')).toHaveTextContent('Could not reach the server.');
    expect(screen.getByText('unreachable')).toHaveAttribute('data-tone', 'danger');
  });
});
